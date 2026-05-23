import streamlit as st
import pandas as pd
import json
import os
from google import genai
from google.genai import types

# Configuración segura del cliente de IA
try:
    client = genai.Client()
except Exception:
    st.error("🔑 Error: Asegúrate de configurar tu variable de entorno GEMINI_API_KEY.")
    st.stop()

DB_FILE = "inventario_tarjetas_beisbol.xlsx"

def inicializar_y_cargar_bd():
    """Garantiza la persistencia e inicialización correcta del archivo."""
    if not os.path.exists(DB_FILE):
        df = pd.DataFrame(columns=[
            "Jugador / Contenido", "Marca / Año", "Número Tarjeta", 
            "Equipo", "Cantidad", "Precio Unitario (USD)", "Valor Estimado (USD)", "Condición / Notas"
        ])
        df.to_excel(DB_FILE, index=False)
        return df
    try:
        return pd.read_excel(DB_FILE)
    except Exception:
        # En caso de estar abierto el archivo o corrupto, lee el CSV de respaldo temporal
        if os.path.exists("respaldo_tarjetas.csv"):
            return pd.read_csv("respaldo_tarjetas.csv")
        st.error("No se pudo leer la base de datos local.")
        st.stop()

def guardar_registros(df_actualizado):
    """Guarda en caliente en Excel y genera un respaldo en CSV por seguridad."""
    df_actualizado.to_excel(DB_FILE, index=False)
    df_actualizado.to_csv("respaldo_tarjetas.csv", index=False)

# --- INTERFAZ COMPATIBLE CON MÓVILES ---
st.set_page_config(page_title="Mi Inventario de Béisbol", layout="wide")
df_inventario = inicializar_y_cargar_bd()

st.title("⚾ Base de Datos Personal de Tarjetas")
st.write("Gestiona tu colección de forma privada. Captura fotos desde tu celular para indexar precios automáticamente.")

tabs = st.tabs(["📸 Escanear con Cámara", "📊 Ver Mi Base de Datos"])

with tabs[0]:
    st.subheader("Capturar o Subir Foto")
    # camera_input abre la cámara nativa automáticamente si estás en tu teléfono celular
    archivo_foto = st.camera_input("Toma una foto a la página de tu álbum:")
    
    if not archivo_foto:
        archivo_foto = st.file_uploader("O selecciona una imagen de tu galería:", type=["jpg", "jpeg", "png"])

    if archivo_foto is not None:
        if st.button("🔍 Extraer Datos e Indexar a Base de Datos"):
            with st.spinner("Procesando imagen con IA y buscando Comps de Mercado..."):
                try:
                    with open("temp_scan.jpg", "wb") as f:
                        f.write(archivo_foto.getbuffer())
                    
                    imagen_api = client.files.upload(file="temp_scan.jpg")
                    
                    prompt = """
                    Analiza la imagen de tarjetas de béisbol. Identifica todas las que sean visibles.
                    Calcula su precio de mercado real online basándote en ventas completadas en subastas recientes (formato RAW).
                    Devuelve ESTRICTAMENTE una lista JSON de objetos con las llaves exactas:
                    - "jugador": Nombre del pelotero o descripción.
                    - "marca_ano": Marca y año de edición (Ej: Topps 1987).
                    - "numero": Número de tarjeta (como texto).
                    - "equipo": Equipo de béisbol.
                    - "cantidad": Número de copias de esa misma tarjeta en la foto (entero).
                    - "precio_unitario": Valor estimado individual en dólares (float).
                    - "notas": Notas o variantes detectadas (Ej: Rookie, All-Star).
                    """
                    
                    response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[imagen_api, prompt],
                        config=types.GenerateContentConfig(response_mime_type="application/json"),
                    )
                    
                    nuevos_items = json.loads(response.text)
                    
                    if nuevos_items:
                        registros_nuevos = []
                        for item in nuevos_items:
                            qty = int(item.get("cantidad", 1))
                            pu = float(item.get("precio_unitario", 0.15))
                            total_val = qty * pu
                            
                            registros_nuevos.append({
                                "Jugador / Contenido": item.get("jugador"),
                                "Marca / Año": item.get("marca_ano"),
                                "Número Tarjeta": str(item.get("numero")),
                                "Equipo": item.get("equipo"),
                                "Cantidad": qty,
                                "Precio Unitario (USD)": pu,
                                "Valor Estimado (USD)": total_val,
                                "Condición / Notas": item.get("notas", "Raw")
                            })
                        
                        df_nuevas_tarjetas = pd.DataFrame(registros_nuevos)
                        df_final = pd.concat([df_inventario, df_nuevas_tarjetas], ignore_index=True)
                        guardar_registros(df_final)
                        
                        st.success(f"¡Se han agregado {len(registros_nuevos)} tarjetas a tu Excel local!")
                        st.dataframe(df_nuevas_tarjetas)
                        st.rerun()
                except Exception as e:
                    st.error(f"Error al procesar: {e}")
                finally:
                    if os.path.exists("temp_scan.jpg"):
                        os.remove("temp_scan.jpg")

with tabs[1]:
    st.subheader("📋 Registros Guardados en Excel")
    if not df_inventario.empty:
        st.dataframe(df_inventario, use_container_width=True)
        
        # Métricas Totales automáticas en tiempo real
        c1, c2 = st.columns(2)
        with c1:
            st.metric("Total de Tarjetas en Posesión", value=int(df_inventario["Cantidad"].sum()))
        with c2:
            st.metric("Valor Total Estimado (USD)", value=f"${df_inventario['Valor Estimado (USD)'].sum():.2f}")
            
        with open(DB_FILE, "rb") as file:
            st.download_button(
                label="📥 Descargar Base de Datos (.XLSX)",
                data=file,
                file_name=DB_FILE,
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
    else:
        st.info("Aún no hay registros en tu base de datos. ¡Escanea tu primera página!")