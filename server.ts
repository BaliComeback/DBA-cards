import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

// Init Gemini Server-Side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // API endpoint to identify cards
  app.post('/api/identify', async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No se recibió ninguna imagen base64.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: 'Falta la variable de entorno GEMINI_API_KEY. Ve a Settings > Secrets en tu panel lateral y agrégala para activar la detección.' 
        });
      }

      const base64Data = image.includes(',') ? image.split(',')[1] : image;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            parts: [
              {
                text: `Eres un experto profesional en tasación e identificación de tarjetas coleccionables deportivas (béisbol, baloncesto, fútbol, etc.).
Analiza detalladamente la tarjeta contenida en la imagen. Proporciona su información técnica y estima el valor de mercado actual en dólares basados en ventas reales recientes.
Toma en cuenta cualquier indicación de Rookie Cards (RC), Autógrafos, inserts especiales, o condiciones visuales de la tarjeta.

Devuelve estrictamente un objeto JSON en español con las siguientes llaves:
- "player": Nombre completo del jugador/atleta
- "team": Equipo del jugador en la tarjeta
- "year": Año de publicación (ej. 1988)
- "set": Marca de la tarjeta (ej. Topps, Upper Deck, Fleer, Donruss, Panini)
- "cardNumber": Número de la tarjeta en la colección (ej. 361 o RC)
- "sport": Categoría estricta de deporte: "Baseball", "Basketball", "Football", "Soccer", "Other"
- "minPrice": Estimación mínima realista en USD (número decimal, ej: 1.5)
- "maxPrice": Estimación máxima realista en USD (número decimal, ej: 4.0)
- "notes": Notas sobre la tarjeta (ej: RC, HOF, Rookie, Inserto, Vintage o Normal)
- "confidence": Confianza entre 0.0 y 1.0 de la detección
- "insight": Explicación corta en español de la tarjeta, qué la hace valiosa, detalles del jugador y consejos de cuidado.`
              },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: 'image/jpeg'
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              player: { type: Type.STRING },
              team: { type: Type.STRING },
              year: { type: Type.STRING },
              set: { type: Type.STRING },
              cardNumber: { type: Type.STRING },
              sport: { type: Type.STRING, enum: ['Baseball', 'Basketball', 'Football', 'Soccer', 'Other'] },
              minPrice: { type: Type.NUMBER },
              maxPrice: { type: Type.NUMBER },
              notes: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              insight: { type: Type.STRING }
            },
            required: ['player', 'team', 'year', 'set', 'cardNumber', 'sport', 'minPrice', 'maxPrice', 'notes', 'confidence', 'insight']
          }
        }
      });

      if (!response.text) {
        throw new Error('Gemini no devolvió texto');
      }

      const data = JSON.parse(response.text);
      return res.json(data);
    } catch (error: any) {
      console.error('Error al procesar la imagen con Gemini:', error);
      return res.status(500).json({ error: error.message || 'Error interno del servidor al procesar la imagen' });
    }
  });

  // API endpoint to re-fetch price comps using search grounding
  app.post('/api/reprice', async (req, res) => {
    try {
      const { player, team, set, year, cardNumber, sport, notes } = req.body;
      if (!player) {
        return res.status(400).json({ error: 'Se requiere el nombre del jugador.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: 'Falta la variable de entorno GEMINI_API_KEY. Ve a Settings > Secrets en tu panel lateral y agrégala para activar la detección.' 
        });
      }

      const promptMessage = `Busca comps reales en Internet (eBay, subastas, COMC) para esta tarjeta deportiva y determina de manera precisa su precio actual estimado en USD de forma realista.
Tarjeta Detallada:
- Jugador: ${player}
- Equipo: ${team || 'N/A'}
- Set/Marca: ${set || 'N/A'}
- Año: ${year || 'N/A'}
- Número de Tarjeta: ${cardNumber || 'N/A'}
- Deporte: ${sport || 'N/A'}
- Notas/Atributo: ${notes || 'Normal'}

Devuelve estrictamente un objeto JSON con las siguientes propiedades:
- "minPrice": Número decimal que representa el rango mínimo estimado real en USD.
- "maxPrice": Número decimal que representa el rango máximo estimado real en USD.
- "insight": Explicación muy breve en español sobre las subastas o ventas encontradas recientemente que justifican el precio (máximo 120 palabras).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptMessage,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              minPrice: { type: Type.NUMBER },
              maxPrice: { type: Type.NUMBER },
              insight: { type: Type.STRING }
            },
            required: ['minPrice', 'maxPrice', 'insight']
          }
        }
      });

      if (!response.text) {
        throw new Error('Gemini no devolvió texto de precios');
      }

      const data = JSON.parse(response.text);
      return res.json(data);
    } catch (error: any) {
      console.error('Error al actualizar precio online con Gemini:', error);
      return res.status(500).json({ error: error.message || 'Error interno del servidor al consultar precios' });
    }
  });

  // Serve static or dynamically through Vite
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server failure", err);
  process.exit(1);
});
