import { useState, useEffect, useRef, Fragment } from 'react';
import { 
  Camera, 
  Upload, 
  Search, 
  TrendingUp, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Award, 
  AlertCircle,
  FileSpreadsheet,
  Check,
  X,
  Filter,
  PlusCircle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Cloud,
  LogOut,
  Edit3,
  LayoutGrid,
  List
} from 'lucide-react';

import { initAuth, googleSignIn, logout as googleSignOut } from './utils/googleAuth';
import { listBackups, uploadBackup, downloadBackup, deleteBackupFile } from './utils/driveService';

interface SportsCard {
  id: string;
  player: string;
  team: string;
  year: string;
  set: string;
  cardNumber: string;
  sport: 'Baseball' | 'Basketball' | 'Football' | 'Soccer' | 'Other';
  minPrice: number;
  maxPrice: number;
  notes: string;
  insight: string;
  scannedAt: string;
  image?: string; // Optional captured image preview
  quantity: number;
}

const PRESET_CARDS: SportsCard[] = [
  {
    id: "preset-1",
    player: "Greg Maddux",
    team: "Chicago Cubs",
    year: "1988",
    set: "Topps",
    cardNumber: "361",
    sport: "Baseball",
    minPrice: 15.00,
    maxPrice: 45.00,
    notes: "Rookie Card",
    insight: "Una de las tarjetas de novato más codiciadas de Greg Maddux. En excelente estado de conservación, su valor se incrementa exponencialmente si se certifica por PSA.",
    scannedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    quantity: 1
  },
  {
    id: "preset-2",
    player: "Don Mattingly",
    team: "New York Yankees",
    year: "1988",
    set: "Topps",
    cardNumber: "100",
    sport: "Baseball",
    minPrice: 4.00,
    maxPrice: 12.00,
    notes: "Estrella / Capitán",
    insight: "El legendario 'Hit Man' de los Yankees. Esta edición Topps de 1988 cuenta con un reverso clásico y detallado del desempeño del pelotero.",
    scannedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    quantity: 1
  },
  {
    id: "preset-3",
    player: "Steve Sax",
    team: "New York Yankees",
    year: "1990",
    set: "Upper Deck",
    cardNumber: "25",
    sport: "Baseball",
    minPrice: 0.50,
    maxPrice: 2.00,
    notes: "Base",
    insight: "Excelente tarjeta base del segunda base Steve Sax de los Yankees de Nueva York en la prestigiada marca Upper Deck de 1990.",
    scannedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    quantity: 3
  },
  {
    id: "preset-4",
    player: "Andre Dawson (All-Star)",
    team: "Chicago Cubs",
    year: "1988",
    set: "Topps",
    cardNumber: "750",
    sport: "Baseball",
    minPrice: 3.50,
    maxPrice: 10.00,
    notes: "HOF",
    insight: "Edición especial All-Star celebrando la gran temporada de MVP de Andre 'The Hawk' Dawson con los Cachorros.",
    scannedAt: new Date(Date.now() - 43200000).toISOString(),
    quantity: 1
  },
  {
    id: "preset-5",
    player: "Rafael Palmeiro",
    team: "Chicago Cubs",
    year: "1987",
    set: "Topps",
    cardNumber: "634",
    sport: "Baseball",
    minPrice: 8.00,
    maxPrice: 22.00,
    notes: "Rookie",
    insight: "Tarjeta de novato auténtica del toletero Rafael Palmeiro vistiendo la clásica franela de los Chicago Cubs.",
    scannedAt: new Date(Date.now() - 3600000).toISOString(),
    quantity: 1
  },
  {
    id: "preset-6",
    player: "Don Mattingly (Hit Man)",
    team: "New York Yankees",
    year: "1988",
    set: "Topps",
    cardNumber: "2",
    sport: "Baseball",
    minPrice: 5.00,
    maxPrice: 15.00,
    notes: "Inserto",
    insight: "Inserto especial destacado que rinde homenaje al apodo legendario de Don Mattingly. Gran diseño retro en excelentes condiciones.",
    scannedAt: new Date(Date.now() - 1800000).toISOString(),
    quantity: 1
  },
  {
    id: "preset-7",
    player: "Mark Grace",
    team: "Chicago Cubs",
    year: "1989",
    set: "Topps",
    cardNumber: "365",
    sport: "Baseball",
    minPrice: 2.00,
    maxPrice: 8.00,
    notes: "Estrella",
    insight: "Mark Grace fue uno de los bateadores más consistentes de la década de los 90. Esta tarjeta captura sus primeros años en Chicago.",
    scannedAt: new Date(Date.now() - 600000).toISOString(),
    quantity: 1
  }
];

export default function App() {
  const [collection, setCollection] = useState<SportsCard[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'inventory'>('scan');
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [selectedTeam, setSelectedTeam] = useState<string>('All');

  // Manual Addition Toggle & Fields
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualPlayer, setManualPlayer] = useState('');
  const [manualTeam, setManualTeam] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualSet, setManualSet] = useState('Topps');
  const [manualCardNo, setManualCardNo] = useState('');
  const [manualSport, setManualSport] = useState<'Baseball' | 'Basketball' | 'Football' | 'Soccer' | 'Other'>('Baseball');
  const [manualMin, setManualMin] = useState(0.50);
  const [manualMax, setManualMax] = useState(2.00);
  const [manualNotes, setManualNotes] = useState('Raw');
  const [manualInsight, setManualInsight] = useState('Tarjeta agregada manualmente al inventario.');

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scan workflow
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Detail Toggle State for inventory cards
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Layout View mode, Editing, and AI price updating states
  const [inventoryViewMode, setInventoryViewMode] = useState<'grid' | 'list'>('list');
  const [editingCard, setEditingCard] = useState<SportsCard | null>(null);
  const [updatingPriceCardId, setUpdatingPriceCardId] = useState<string | null>(null);

  // Custom toast notification system to replace window.alert
  const [appNotification, setAppNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Auto-clear notification after 5 seconds
  useEffect(() => {
    if (!appNotification) return;
    const timer = setTimeout(() => {
      setAppNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [appNotification]);

  // General helper to show notification
  const notifyUser = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setAppNotification({ type, message });
  };

  // Custom confirmation modal system to replace window.confirm
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Google Drive & Auth state
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveNotification, setDriveNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDrivePanel, setShowDrivePanel] = useState(false);

  // Setup live Google Authentication status listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        fetchBackupsList(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setBackups([]);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const fetchBackupsList = async (token: string) => {
    setIsDriveLoading(true);
    try {
      const list = await listBackups(token);
      setBackups(list);
    } catch (err: any) {
      console.error("No se pudieron listar las copias de seguridad de Google Drive:", err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsDriveLoading(true);
    setDriveNotification(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        await fetchBackupsList(result.accessToken);
        setDriveNotification({
          type: 'success',
          message: '¡Conectado exitosamente con tu cuenta de Google Drive!'
        });
        setShowDrivePanel(true);
      }
    } catch (err: any) {
      console.error("Error al iniciar sesión con Google provider", err);
      setDriveNotification({
        type: 'error',
        message: err.message || 'No se pudo iniciar sesión o faltan permisos para Google Drive.'
      });
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setIsDriveLoading(true);
    setDriveNotification(null);
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleToken(null);
      setBackups([]);
      setDriveNotification({
        type: 'success',
        message: 'Sesión de Google Drive cerrada con éxito.'
      });
    } catch (err: any) {
      console.error("Error al cerrar sesión", err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!googleToken) return;
    if (collection.length === 0) {
      notifyUser("No hay tarjetas cargadas en tu colección para respaldar.", "error");
      return;
    }
    setIsDriveLoading(true);
    setDriveNotification(null);
    try {
      // Create readable timestamp for the backup filename
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const fileName = `GigaComps_Backup_${dateStr}.json`;
      
      await uploadBackup(googleToken, collection, fileName);
      await fetchBackupsList(googleToken);
      
      setDriveNotification({
        type: 'success',
        message: `¡Copia de seguridad "${fileName}" guardada exitosamente en tu Google Drive!`
      });
    } catch (err: any) {
      console.error("Fallo al subir copia de seguridad", err);
      setDriveNotification({
        type: 'error',
        message: `Fallo al subir copia de seguridad a Google Drive: ${err.message}`
      });
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleRestoreBackup = async (fileId: string, fileName: string, merge: boolean) => {
    if (!googleToken) return;
    
    const actionText = merge ? "COMBINAR" : "REEMPLAZAR POR COMPLETO";
    let warnText = "";
    if (merge) {
      warnText = `¿Estás seguro de que deseas COMBINAR tu inventario actual con las tarjetas de la copia de seguridad "${fileName}"? Las tarjetas idénticas sumarán sus cantidades.`;
    } else {
      warnText = `¡ADVERTENCIA DE SOBRESCRITURA! ¿Estás seguro de que deseas REEMPLAZAR tu colección actual con la copia de seguridad "${fileName}"? Esto eliminará tus tarjetas locales de la app y las reemplazará íntegramente con las del archivo.`;
    }
      
    setConfirmModal({
      title: "Confirmar Restauración de Copia de Seguridad",
      message: warnText,
      confirmText: actionText,
      cancelText: "Atrás",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsDriveLoading(true);
        setDriveNotification(null);
        try {
          const backupCollection = await downloadBackup(googleToken, fileId);
          if (!Array.isArray(backupCollection)) {
            throw new Error("El archivo de copia de seguridad no contiene una estructura de colección válida.");
          }
          
          let updated: SportsCard[];
          if (merge) {
            const map = new Map<string, SportsCard>();
            // Add existing cards to map
            collection.forEach(card => {
              const key = `${card.player}|${card.team}|${card.set}|${card.year}|${card.cardNumber}`.toLowerCase();
              map.set(key, { ...card });
            });
            
            // Merge backup cards
            backupCollection.forEach((card: any) => {
              const key = `${card.player}|${card.team}|${card.set}|${card.year}|${card.cardNumber}`.toLowerCase();
              if (map.has(key)) {
                const existing = map.get(key)!;
                existing.quantity += (card.quantity || 1);
              } else {
                // Give it a fresh client ID if none exists
                map.set(key, { 
                  ...card, 
                  id: card.id || "card-" + Date.now() + Math.random().toString(36).substring(2, 7) 
                });
              }
            });
            updated = Array.from(map.values());
          } else {
            updated = backupCollection;
          }
          
          saveCollection(updated);
          setDriveNotification({
            type: 'success',
            message: `¡Restauración exitosa! Tu colección ha sido actualizada por el método de ${actionText}.`
          });
        } catch (err: any) {
          console.error("Restore failed", err);
          setDriveNotification({
            type: 'error',
            message: `Error al descargar o restaurar copia: ${err.message}`
          });
        } finally {
          setIsDriveLoading(false);
        }
      }
    });
  };

  const handleDeleteBackup = async (fileId: string, fileName: string) => {
    if (!googleToken) return;
    
    setConfirmModal({
      title: "Eliminar Copia de Seguridad",
      message: `¿Estás seguro de ELIMINAR permanentemente el archivo "${fileName}" de tu Google Drive? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar archivo",
      cancelText: "Atrás",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsDriveLoading(true);
        setDriveNotification(null);
        try {
          await deleteBackupFile(googleToken, fileId);
          await fetchBackupsList(googleToken);
          setDriveNotification({
            type: 'success',
            message: `Archivo "${fileName}" eliminado con éxito de tu Google Drive.`
          });
        } catch (err: any) {
          console.error("Delete backup file failed", err);
          setDriveNotification({
            type: 'error',
            message: `Error al eliminar archivo: ${err.message}`
          });
        } finally {
          setIsDriveLoading(false);
        }
      }
    });
  };

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('sports_card_collection');
    if (saved) {
      try {
        setCollection(JSON.parse(saved));
      } catch (e) {
        console.error("No se pudo cargar desde localStorage", e);
        setCollection(PRESET_CARDS);
      }
    } else {
      setCollection(PRESET_CARDS);
      localStorage.setItem('sports_card_collection', JSON.stringify(PRESET_CARDS));
    }
  }, []);

  // Save to local storage helper
  const saveCollection = (updated: SportsCard[]) => {
    setCollection(updated);
    localStorage.setItem('sports_card_collection', JSON.stringify(updated));
  };

  // Camera Actions
  const startCamera = async () => {
    setCameraError(null);
    setImagePreview(null);
    setScanResult(null);
    setScanError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera fail", err);
      setCameraError("No pudimos conectar con tu cámara. Por favor asegúrate de habilitar los permisos en el navegador, o arrastra un archivo de imagen.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImagePreview(dataUrl);
        stopCamera();
        // Trigger identification automatically
        analyseImage(dataUrl);
      }
    }
  };

  // File Upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setScanResult(null);
        setScanError(null);
        // Automatically analyze
        analyseImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setScanResult(null);
        setScanError(null);
        analyseImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch identity from server AI
  const analyseImage = async (base64Image: string) => {
    setScanning(true);
    setScanError(null);
    try {
      const response = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        throw new Error(errObj.error || `Error del servidor (${response.status})`);
      }
      const data = await response.json();
      setScanResult(data);
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || 'Error de comunicación con el servicio Gemini. Revisa tus credenciales.');
    } finally {
      setScanning(false);
    }
  };

  // Save scanned card
  const addScannedCard = () => {
    if (!scanResult) return;
    const newCard: SportsCard = {
      id: "card-" + Date.now(),
      player: scanResult.player,
      team: scanResult.team,
      year: scanResult.year,
      set: scanResult.set,
      cardNumber: scanResult.cardNumber,
      sport: scanResult.sport || 'Baseball',
      minPrice: Number(scanResult.minPrice) || 0.50,
      maxPrice: Number(scanResult.maxPrice) || 2.00,
      notes: scanResult.notes || 'Raw',
      insight: scanResult.insight || 'Sin insights especiales.',
      scannedAt: new Date().toISOString(),
      image: imagePreview || undefined,
      quantity: 1
    };

    saveCollection([newCard, ...collection]);
    setScanResult(null);
    setImagePreview(null);
    // Switch to active collection tab to let user see it!
    setActiveTab('inventory');
  };

  // Adjust Quantity
  const updateQuantity = (id: string, delta: number) => {
    const updated = collection.map(card => {
      if (card.id === id) {
        const newQty = Math.max(1, card.quantity + delta);
        return { ...card, quantity: newQty };
      }
      return card;
    });
    saveCollection(updated);
  };

  // Delete Card
  const deleteCard = (id: string) => {
    setConfirmModal({
      title: "Eliminar Tarjeta",
      message: "¿Estás seguro de que deseas eliminar esta tarjeta de tu inventario local?",
      confirmText: "Eliminar tarjeta",
      cancelText: "Atrás",
      onConfirm: () => {
        const updated = collection.filter(card => card.id !== id);
        saveCollection(updated);
        setConfirmModal(null);
        notifyUser("Tarjeta deportiva eliminada de tu catálogo.", "success");
      }
    });
  };

  // Update card prices online using Gemini Search AI Grounding
  const handleUpdatePriceOnline = async (cardId: string) => {
    const cardToUpdate = collection.find(c => c.id === cardId);
    if (!cardToUpdate) return;

    setUpdatingPriceCardId(cardId);
    try {
      const response = await fetch('/api/reprice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player: cardToUpdate.player,
          team: cardToUpdate.team,
          set: cardToUpdate.set,
          year: cardToUpdate.year,
          cardNumber: cardToUpdate.cardNumber,
          sport: cardToUpdate.sport,
          notes: cardToUpdate.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const freshPriceData = await response.json();
      
      const updatedCollection = collection.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            minPrice: Number(freshPriceData.minPrice) || card.minPrice,
            maxPrice: Number(freshPriceData.maxPrice) || card.maxPrice,
            insight: freshPriceData.insight || card.insight,
          };
        }
        return card;
      });

      saveCollection(updatedCollection);
      notifyUser(`¡Precios de ${cardToUpdate.player} actualizados online exitosamente!`, "success");
      
      // If we are currently editing this card, update editingCard state as well to reflect immediately
      if (editingCard && editingCard.id === cardId) {
        setEditingCard(prev => prev ? {
          ...prev,
          minPrice: Number(freshPriceData.minPrice) || prev.minPrice,
          maxPrice: Number(freshPriceData.maxPrice) || prev.maxPrice,
          insight: freshPriceData.insight || prev.insight,
        } : null);
      }
    } catch (err: any) {
      console.error(err);
      notifyUser(`No se pudieron actualizar los precios: ${err.message || 'Error de conexión'}`, "error");
    } finally {
      setUpdatingPriceCardId(null);
    }
  };

  // Save changes to edited card
  const handleSaveEditCard = (updatedCard: SportsCard) => {
    const updated = collection.map(card => {
      if (card.id === updatedCard.id) {
        return updatedCard;
      }
      return card;
    });
    saveCollection(updated);
    setEditingCard(null);
  };

  // Custom additions
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPlayer || !manualTeam) {
      notifyUser("Por favor rellena el nombre del jugador y el equipo.", "warning");
      return;
    }

    const newCard: SportsCard = {
      id: "manual-" + Date.now(),
      player: manualPlayer,
      team: manualTeam,
      year: manualYear || "1990",
      set: manualSet || "Topps",
      cardNumber: manualCardNo || "1",
      sport: manualSport,
      minPrice: Number(manualMin) || 0.50,
      maxPrice: Number(manualMax) || 2.00,
      notes: manualNotes || "Base",
      insight: manualInsight || "Tarjeta ingresada de forma manual.",
      scannedAt: new Date().toISOString(),
      quantity: 1
    };

    saveCollection([newCard, ...collection]);
    notifyUser(`¡Tarjeta de ${manualPlayer} agregada exitosamente!`, "success");

    // reset fields
    setManualPlayer('');
    setManualTeam('');
    setManualYear('');
    setManualCardNo('');
    setManualMin(0.50);
    setManualMax(2.00);
    setShowManualForm(false);
  };

  // Export fully structured Maestro card database to CSV
  const handleExportCSV = () => {
    if (collection.length === 0) {
      notifyUser("No hay tarjetas para descargar.", "warning");
      return;
    }
    
    const headers = ["Equipo", "Jugador", "Marca/Año", "Número", "Categoría", "Cantidad", "Precio Mínimo (USD)", "Precio Máximo (USD)", "Valor Conservador Total (USD)", "Notas"];
    const rows = collection.map(card => [
      `"${card.team.replace(/"/g, '""')}"`,
      `"${card.player.replace(/"/g, '""')}"`,
      `"${card.set} ${card.year}"`.replace(/"/g, '""'),
      `"${card.cardNumber}"`,
      `"${card.sport}"`,
      card.quantity,
      card.minPrice,
      card.maxPrice,
      (card.minPrice * card.quantity).toFixed(2),
      `"${card.notes.replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inventario_Maestro_Tarjetas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Math metrics
  const totalCards = collection.reduce((accum, val) => accum + val.quantity, 0);
  const minPortfolioValue = collection.reduce((accum, val) => accum + (val.minPrice * val.quantity), 0);
  const maxPortfolioValue = collection.reduce((accum, val) => accum + (val.maxPrice * val.quantity), 0);

  // Unique Teams list for filter dropdown
  const uniqueTeams = Array.from(new Set(collection.map(c => c.team))).sort();

  // Filter and search
  const filteredCollection = collection.filter(card => {
    const matchesSearch = 
      card.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.set.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.cardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSport = selectedSport === 'All' || card.sport === selectedSport;
    const matchesTeam = selectedTeam === 'All' || card.team === selectedTeam;

    return matchesSearch && matchesSport && matchesTeam;
  });

  return (
    <div id="app-root" className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans transition-colors antialiased">
      {/* Visual background ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* Elegant minimalist header layout */}
      <header id="header-bar" className="border-b border-zinc-900 bg-[#0c0d14]/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Sparkles className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">GigaComps AI</h1>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">v2.5 Full-Stack</span>
              </div>
              <p className="text-[11px] text-zinc-500">Evaluación y escaneo inteligente de tarjetas de colección</p>
            </div>
          </div>

          {/* Core Tab Switches & Google Drive Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDrivePanel(!showDrivePanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                googleToken 
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/20 shadow-sm shadow-emerald-500/5' 
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
              title="Copia de seguridad y sincronización con Google Drive"
            >
              <Cloud className={`w-3.5 h-3.5 ${googleToken ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">{googleUser ? 'Google Drive Activo' : 'Sincronizar Nube'}</span>
              <span className="inline sm:hidden">{googleUser ? 'Drive' : 'Nube'}</span>
              {googleUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>

            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                id="btn-tab-scan"
                onClick={() => { stopCamera(); setActiveTab('scan'); }}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'scan' 
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10 font-bold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                📸 Escáner IA
              </button>
              <button
                id="btn-tab-inventory"
                onClick={() => { stopCamera(); setActiveTab('inventory'); }}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'inventory' 
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10 font-bold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                📋 Mi Inventario ({collection.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Bento Statistics Row (Always visible for robust tracking) */}
      <section id="metrics-panel" className="bg-[#0c0d14]/40 border-b border-zinc-900/50 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <p className="text-xs text-zinc-400 font-medium font-sans">Total en Posesión</p>
            <h3 className="text-2xl font-bold mt-1 text-white flex items-baseline gap-1">
              {totalCards} 
              <span className="text-xs font-semibold text-zinc-500">tarjetas ({collection.length} únicas)</span>
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Valor Estimado Conservador
            </p>
            <h3 className="text-2xl font-bold mt-1 text-white">
              ${minPortfolioValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs text-zinc-500 ml-1">USD</span>
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <p className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <Award className="w-3 h-3" /> Valor Techo Estimado
            </p>
            <h3 className="text-2xl font-bold mt-1 text-zinc-100">
              ${maxPortfolioValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs text-zinc-500 ml-1">USD</span>
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 backdrop-blur-sm col-span-2 md:col-span-1">
            <p className="text-xs text-emerald-400 font-medium">Rango de Comp de Mercado</p>
            <div className="mt-2 text-xs text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Colección Máxima:</span>
                <span className="font-bold text-white">${maxPortfolioValue > 0 ? (maxPortfolioValue - minPortfolioValue).toFixed(1) : 0} USD Delta</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[65%]"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content body */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-8">
        
        {/* Collapsible Google Drive Backup & Sync Center */}
        {showDrivePanel && (
          <div id="google-drive-sync-panel" className="mb-8 p-6 rounded-2xl bg-[#0c0d16] border border-zinc-800 shadow-xl space-y-6 animate-fadeIn relative overflow-hidden">
            {/* Ambient decorative shine */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Centro de Sincronización en la Nube</h3>
                  <p className="text-[11px] text-zinc-500">Respalda, restaura y mantén a salvo tu inventario de tarjetas deportivas autografiadas y comps</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDrivePanel(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                title="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Alert Banner */}
            {driveNotification && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 font-sans ${
                driveNotification.type === 'success' 
                  ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                  : 'bg-rose-950/20 border-rose-900/30 text-rose-300'
              }`}>
                {driveNotification.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{driveNotification.message}</p>
                </div>
                <button 
                  onClick={() => setDriveNotification(null)}
                  className="text-zinc-500 hover:text-white text-[10px]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Auth States */}
            {!googleToken ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Respalda tu colección deportiva en Google Drive</h4>
                  <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    Al conectar tu cuenta de Google, crearemos copias de seguridad de forma privada en tu carpeta personal de Drive. Podrás restaurar o fusionar tu inventario en cualquier momento o dispositivo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isDriveLoading}
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isDriveLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22s.81-.63.81-.63z" fillRule="evenodd" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  Iniciar Sesión con Google
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Account & Quick Actions Column */}
                <div className="md:col-span-4 space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                    <div className="flex items-center gap-2.5">
                      {googleUser?.photoURL ? (
                        <img src={googleUser.photoURL} alt="Foto Perfil" className="w-8 h-8 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/20">
                          G
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <span className="text-zinc-200 text-xs font-bold block truncate">{googleUser?.displayName || 'Usuario de Google'}</span>
                        <span className="text-zinc-500 text-[10px] block truncate">{googleUser?.email}</span>
                      </div>
                    </div>

                    <hr className="border-zinc-900" />

                    <div className="flex flex-col gap-2">
                      <button 
                        type="button"
                        onClick={handleCreateBackup}
                        disabled={isDriveLoading}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        {isDriveLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Cloud className="w-3.5 h-3.5" />
                        )}
                        Crear Copia Ahora
                      </button>

                      <button 
                        type="button"
                        onClick={() => fetchBackupsList(googleToken)}
                        disabled={isDriveLoading}
                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isDriveLoading ? 'animate-spin' : ''}`} />
                        Refrescar Lista
                      </button>

                      <button 
                        type="button"
                        onClick={handleGoogleSignOut}
                        disabled={isDriveLoading}
                        className="w-full py-2 bg-zinc-900/40 hover:bg-zinc-950 hover:text-red-400 text-zinc-600 hover:text-white text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" />
                        Desconectar Cuenta
                      </button>
                    </div>
                  </div>
                </div>

                {/* Backups List Column */}
                <div className="md:col-span-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400 font-sans">Copias guardadas en Drive ({backups.length})</span>
                    {isDriveLoading && <span className="text-[10px] text-emerald-400 font-medium tracking-wide">Actualizando...</span>}
                  </div>

                  {backups.length === 0 ? (
                    <div className="p-8 border border-dashed border-zinc-900 rounded-xl text-center bg-zinc-950/20">
                      <Cloud className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400 font-sans">No tienes copias de seguridad activas en Google Drive.</p>
                      <p className="text-[10px] text-zinc-600 mt-1 font-sans">Haz clic en "Crear Copia Ahora" para guardar tu inventario actual.</p>
                    </div>
                  ) : (
                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {backups.map((bk) => (
                        <div key={bk.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors">
                          <div>
                            <span className="font-mono text-zinc-300 block text-[11px] truncate max-w-[280px]">{bk.name}</span>
                            <span className="text-[10px] text-zinc-500 block mt-0.5 font-sans">
                              Creado: {new Date(bk.createdTime).toLocaleString('es-MX')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRestoreBackup(bk.id, bk.name, true)}
                              disabled={isDriveLoading}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 font-semibold rounded border border-zinc-800 text-[10px] transition-all cursor-pointer"
                              title="Combina estas tarjetas con tu catálogo actual conservando las ya registradas"
                            >
                              Combinar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRestoreBackup(bk.id, bk.name, false)}
                              disabled={isDriveLoading}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-amber-500 hover:text-amber-400 font-semibold rounded border border-zinc-800 text-[10px] transition-all cursor-pointer"
                              title="Sobrescribe por completo tu catálogo actual con los datos del respaldo"
                            >
                              Sobrescribir
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteBackup(bk.id, bk.name)}
                              disabled={isDriveLoading}
                              className="p-1 px-1.5 bg-zinc-900/40 hover:bg-zinc-950 text-zinc-600 hover:text-rose-450 text-zinc-600 hover:text-rose-450 rounded border border-zinc-800/20 transition-all cursor-pointer"
                              title="Eliminar este respaldo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: AI CAMERA SCANNER WORKFLOW */}
        {activeTab === 'scan' && (
          <div id="scan-tab-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Visual Instruction Guide Case */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                <h3 className="text-base font-bold text-zinc-100">¿Cómo escanear tus tarjetas?</h3>
                <ul className="space-y-3 text-xs text-zinc-400">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white shrink-0 font-bold">1</span>
                    <p>Enciende tu cámara o sube un archivo de foto limpio (JPG/PNG).</p>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white shrink-0 font-bold">2</span>
                    <p>Asegúrate de tener <strong>buena iluminación</strong> y que el jugador y el texto sean legibles.</p>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white shrink-0 font-bold">3</span>
                    <p>Nuestra IA analizará marcas históricas y subastas reales para calcular su precio.</p>
                  </li>
                </ul>

                <hr className="border-zinc-800/80" />

                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">¿No tienes cámara de prueba? Carga una imagen de tu galería o agrega registros manualmente.</p>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold rounded-xl text-white transition-all flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-zinc-400" />
                      Subir archivo desde galería...
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition-all rounded-xl font-medium"
                  >
                    {showManualForm ? "Cancelar Carga Manual" : "Añadir Tarjeta Manualmente"}
                  </button>
                </div>
              </div>

              {/* Collapsible Manual Addition Form */}
              {showManualForm && (
                <form onSubmit={handleManualAdd} className="p-5 rounded-2xl bg-[#0c0d15] border border-zinc-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Añadir Entrada Manual</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[11px] text-zinc-400 block mb-1">Nombre del Jugador *</label>
                      <input 
                        type="text" 
                        value={manualPlayer}
                        onChange={(e) => setManualPlayer(e.target.value)}
                        placeholder="Ej: Ken Griffey Jr."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Equipo *</label>
                      <input 
                        type="text" 
                        value={manualTeam}
                        onChange={(e) => setManualTeam(e.target.value)}
                        placeholder="Ej: Seattle Mariners"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Año / Temporada</label>
                      <input 
                        type="text" 
                        value={manualYear}
                        onChange={(e) => setManualYear(e.target.value)}
                        placeholder="Ej: 1989"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Marca / Set</label>
                      <input 
                        type="text" 
                        value={manualSet}
                        onChange={(e) => setManualSet(e.target.value)}
                        placeholder="Ej: Fleer, Upper Deck"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Número Tarjeta</label>
                      <input 
                        type="text" 
                        value={manualCardNo}
                        onChange={(e) => setManualCardNo(e.target.value)}
                        placeholder="Ej: 110"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Deporte</label>
                      <select 
                        value={manualSport}
                        onChange={(e) => setManualSport(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Baseball">Béisbol</option>
                        <option value="Basketball">Baloncesto</option>
                        <option value="Football">Fútbol Americano</option>
                        <option value="Soccer">Fútbol</option>
                        <option value="Other">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Categoría / Notas</label>
                      <input 
                        type="text" 
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        placeholder="Ej: Rookie, All-Star"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Precio Mín (USD)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={manualMin}
                        onChange={(e) => setManualMin(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Precio Máx (USD)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={manualMax}
                        onChange={(e) => setManualMax(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Insight o Descripción de la tarjeta</label>
                    <textarea 
                      value={manualInsight}
                      onChange={(e) => setManualInsight(e.target.value)}
                      rows={2}
                      placeholder="Agrega notas de conservación o historia..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 font-bold text-xs text-zinc-950 rounded-xl transition-all"
                  >
                    Guardar tarjeta en Mi Catálogo
                  </button>
                </form>
              )}
            </div>

            {/* SCANNING CANVAS / PREVIEW SCREEN STAGE */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Main Camera Frame Render */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative border-2 border-dashed border-zinc-800 rounded-2xl overflow-hidden bg-[#0c0d15] flex flex-col items-center justify-center p-6 min-h-[420px] shadow-inner transition-colors duration-200"
              >
                {cameraActive && !imagePreview ? (
                  /* Web Video Camera Feed Active */
                  <div className="w-full h-full flex flex-col items-center justify-between">
                    <div className="relative w-full max-w-xl mx-auto rounded-xl overflow-hidden border border-zinc-800">
                      <video 
                        ref={videoRef} 
                        playsInline 
                        muted 
                        className="w-full object-cover aspect-video"
                      ></video>
                      <canvas ref={canvasRef} className="hidden" />
                      {/* Interactive targeting outline reticle */}
                      <div className="absolute inset-4 sm:inset-10 border-2 border-dashed border-emerald-400/80 rounded-lg flex items-center justify-center pointer-events-none">
                        <span className="bg-zinc-950/80 backdrop-blur-sm text-[10px] text-emerald-400 font-bold px-2 py-1 rounded border border-emerald-500/20">
                          Ubica la tarjeta dentro del visor
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-4">
                      <button 
                        onClick={capturePhoto} 
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Camera className="w-4 h-4" />
                        Tomar Foto e Indexar
                      </button>
                      <button 
                        onClick={stopCamera} 
                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : imagePreview ? (
                  /* File upload / Snapshot preview display */
                  <div className="w-full max-w-xl flex flex-col items-center justify-center space-y-4">
                    <div className="relative border border-zinc-800 rounded-xl overflow-hidden aspect-video w-full flex items-center justify-center bg-zinc-950 font-sans">
                      <img 
                        src={imagePreview} 
                        alt="Vista previa de escáner" 
                        className="max-h-[300px] object-contain" 
                      />
                      {scanning && (
                        <div className="absolute inset-0 bg-[#090a0f]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                          <div className="text-center">
                            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Identificando Tarjeta con IA...</span>
                            <span className="text-[10px] text-zinc-500 mt-1 block">Tasa de comps, set, año y valor del mercado en progreso</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {!scanning && (
                      <div className="flex flex-wrap gap-3 items-center justify-center">
                        <button 
                          onClick={() => imagePreview && analyseImage(imagePreview)}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Re-intentar análisis AI
                        </button>
                        <button 
                          onClick={() => { setImagePreview(null); setScanResult(null); }}
                          className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg text-xs"
                        >
                          Escanear otra tarjeta
                        </button>
                        <button 
                          onClick={startCamera}
                          className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-semibold rounded-lg text-xs flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" /> Usar Cámara
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Default Empty Drag-Drop Area */
                  <div className="flex flex-col items-center justify-center space-y-4 text-center cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-md">
                      <Camera className="w-8 h-8 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">Arrastra o selecciona la foto de tu tarjeta</h4>
                      <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                        Permite que el algoritmo Gemini examine las imágenes de tu álbum físico y las añada automáticamente.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 justify-center">
                      <button 
                        onClick={startCamera}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/15"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Activar Cámara Web
                      </button>

                      <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer border border-zinc-700/60 transition-all">
                        <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                        Elegir archivo
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan Error Message Banner inside stage */}
              {scanError && (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 font-sans flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-200">No se pudo identificar la tarjeta</h4>
                    <p className="text-[11px] text-rose-300/80 mt-1">{scanError}</p>
                    <p className="text-[11px] text-zinc-500 mt-2">Prueba subiendo una foto distinta o ingresando los datos en la columna de la izquierda de forma directa.</p>
                  </div>
                </div>
              )}

              {/* CAMERA GRANTED ACCESS ISSUES DISPLAY */}
              {cameraError && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/20 flex items-start gap-3 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-zinc-400">{cameraError}</p>
                </div>
              )}

              {/* GEMINI INTELLIGENT COMP DETAILS IDENTIFIED BLOCK */}
              {scanResult && !scanning && (
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6 animate-fadeIn">
                  
                  {/* Title and Badge Reveal */}
                  <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded">
                          {scanResult.sport || "Baseball"}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-brand tracking-wider px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                          Confianza: {Math.round((scanResult.confidence || 0.90) * 100)}%
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white mt-1.5">{scanResult.player}</h3>
                      <p className="text-xs text-zinc-400">{scanResult.team} — {scanResult.set} ({scanResult.year})</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Precio de Mercado</span>
                      <span className="text-lg font-black text-emerald-400">
                        ${scanResult.minPrice} - ${scanResult.maxPrice} USD
                      </span>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
                    <div className="p-3 bg-zinc-950 rounded-lg">
                      <span className="text-zinc-500 text-[10px] block font-medium">Tarjeta Nº</span>
                      <span className="text-zinc-200 mt-1 block font-bold">#{scanResult.cardNumber || "N/A"}</span>
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-lg">
                      <span className="text-zinc-500 text-[10px] block font-medium">Atributo</span>
                      <span className="text-zinc-200 mt-1 block font-bold">{scanResult.notes || 'Normal'}</span>
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-lg col-span-2">
                      <span className="text-zinc-500 text-[10px] block font-semibold">Consistente con Comps</span>
                      <span className="text-zinc-300 mt-1 block truncate">eBay & Auction Completes</span>
                    </div>
                  </div>

                  {/* Gemini Smart Analysis Text Column */}
                  <div className="p-4 bg-emerald-950/10 border border-emerald-900/10 rounded-xl space-y-2">
                    <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Análisis de Mercado (Gemini AI Expert)
                    </h5>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {scanResult.insight}
                    </p>
                  </div>

                  {/* Add action row */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button 
                      onClick={() => { setScanResult(null); setImagePreview(null); }}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-all"
                    >
                      Descartar e intentar otra
                    </button>
                    <button 
                      onClick={addScannedCard}
                      className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" />
                      ✓ Confirmar y Añadir Tarjeta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE LIBRARY COLLECTION INVENTORY */}
        {activeTab === 'inventory' && (
          <div id="inventory-tab-view" className="space-y-6">
            
            {/* Filter toolbar block */}
            <div className="p-4 bg-[#0c0d14]/80 border border-zinc-900 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
              
              <div className="w-full md:w-auto flex flex-wrap gap-2 items-center">
                <span className="text-xs text-zinc-400 font-semibold mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Deporte:
                </span>
                {['All', 'Baseball', 'Basketball', 'Football', 'Soccer', 'Other'].map(sport => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      selectedSport === sport
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {sport === 'All' ? 'Todos' : sport}
                  </button>
                ))}
              </div>

              {/* Search and drop parameters */}
              <div className="w-full md:w-auto flex items-center gap-3 self-stretch md:self-auto">
                <div className="relative flex-grow md:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por jugador, equipo, notas..."
                    className="w-full md:w-64 bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 transition-all font-sans"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Team filters */}
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                >
                  <option value="All">Cualquier Equipo</option>
                  {uniqueTeams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* View Mode Toggle Controls */}
                <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setInventoryViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      inventoryViewMode === 'list'
                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Vista de Lista"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setInventoryViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      inventoryViewMode === 'grid'
                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Vista de Cuadrícula"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <button 
                  onClick={handleExportCSV}
                  className="p-2 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shrink-0 shadow-md shadow-emerald-500/10"
                  title="Exportar base compatible con Excel (.CSV)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                </button>
              </div>
            </div>

            {/* Empty view list case */}
            {filteredCollection.length === 0 ? (
              <div className="text-center py-16 px-4 border-2 border-dashed border-zinc-900 rounded-2xl bg-[#0c0d15]/50">
                <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-zinc-300">No se encontraron tarjetas</h4>
                <p className="text-xs text-zinc-500 mt-1">Prueba cambiando tu búsqueda o seleccionando otro filtro de deporte.</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <button 
                    onClick={() => { setSearchTerm(''); setSelectedSport('All'); setSelectedTeam('All'); }}
                    className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs"
                  >
                    Restablecer filtros
                  </button>
                  <button 
                    onClick={() => setActiveTab('scan')}
                    className="px-4 py-1.5 bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs"
                  >
                    Añadir mi primera tarjeta
                  </button>
                </div>
              </div>
            ) : inventoryViewMode === 'list' ? (
              /* DENSE TABULAR LIST DESIGN */
              <div className="overflow-x-auto rounded-2xl border border-zinc-900 bg-[#0b0c12] animate-fadeIn">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950/50 text-zinc-400 font-bold uppercase tracking-wider text-[10.5px]">
                      <th className="py-4 px-5">Deportista / Tarjeta</th>
                      <th className="py-4 px-4">Set / Año</th>
                      <th className="py-4 px-4">Deporte</th>
                      <th className="py-4 px-4">Atributo</th>
                      <th className="py-4 px-4 text-center">Cant.</th>
                      <th className="py-4 px-4 text-right">Val. Unit.</th>
                      <th className="py-4 px-4 text-right">Val. Total</th>
                      <th className="py-4 px-5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {filteredCollection.map(card => {
                      const isExpanded = expandedCardId === card.id;
                      const isPriceUpdating = updatingPriceCardId === card.id;
                      const itemValueMin = card.minPrice * card.quantity;
                      const itemValueMax = card.maxPrice * card.quantity;
                      
                      return (
                        <Fragment key={card.id}>
                          <tr className="hover:bg-zinc-950/40 transition-colors group">
                            {/* Card / Player info */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                {card.image ? (
                                  <img 
                                    src={card.image} 
                                    alt={card.player} 
                                    className="w-10 h-10 object-cover rounded-lg border border-zinc-805 shrink-0" 
                                    referrerPolicy="no-referrer" 
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-500 uppercase text-xs shrink-0 font-mono">
                                    {card.player.slice(0, 2)}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-extrabold text-white group-hover:text-emerald-400 text-sm transition-colors">{card.player}</h4>
                                  <p className="text-[11px] text-zinc-500 mt-0.5">{card.team}</p>
                                </div>
                              </div>
                            </td>
                            
                            {/* Set / Year */}
                            <td className="py-4 px-4 text-zinc-300">
                              <div className="font-medium">{card.set} {card.year}</div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Tarj #{card.cardNumber}</div>
                            </td>
                            
                            {/* Sport Badge */}
                            <td className="py-4 px-4">
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-850">
                                {card.sport}
                              </span>
                            </td>
                            
                            {/* Notes */}
                            <td className="py-4 px-4">
                              {card.notes.toLowerCase().includes('rookie') || card.notes.toLowerCase().includes('rc') ? (
                                <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                                  Rookie (RC)
                                </span>
                              ) : card.notes.toLowerCase().includes('hof') ? (
                                <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
                                  HOF
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-400 font-medium">
                                  {card.notes}
                                </span>
                              )}
                            </td>
                            
                            {/* Copies Quantity count */}
                            <td className="py-4 px-4 text-center">
                              <div className="inline-flex items-center gap-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-900">
                                <button 
                                  onClick={() => updateQuantity(card.id, -1)}
                                  className="text-zinc-500 hover:text-amber-500 transition-colors focus:outline-none"
                                  title="Restar copia"
                                >
                                  <MinusCircle className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono font-bold text-white text-xs w-4 text-center">{card.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(card.id, 1)}
                                  className="text-zinc-500 hover:text-emerald-400 transition-colors focus:outline-none"
                                  title="Sumar copia"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            
                            {/* Unit pricing estimate */}
                            <td className="py-4 px-4 text-right font-mono text-zinc-200">
                              <span className="font-bold text-white">${card.minPrice.toFixed(2)}</span> - 
                              <span className="font-bold text-white"> ${card.maxPrice.toFixed(2)}</span>
                            </td>
                            
                            {/* Total pricing value */}
                            <td className="py-4 px-4 text-right">
                              <div className="font-mono font-black text-emerald-400 text-xs">
                                ${itemValueMin.toFixed(2)} - ${itemValueMax.toFixed(2)}
                              </div>
                              <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-sans font-semibold">USD Total</div>
                            </td>
                            
                            {/* Action Row */}
                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                                  className="p-1 px-2 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-lg text-[10px] text-zinc-400 hover:text-white transition-all font-bold uppercase tracking-wider"
                                  title="Ver Insights de IA"
                                >
                                  {isExpanded ? 'Ocultar' : 'Insights'}
                                </button>
                                
                                {/* Refresh AI valuations */}
                                <button
                                  onClick={() => handleUpdatePriceOnline(card.id)}
                                  disabled={isPriceUpdating}
                                  className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-all ${
                                    isPriceUpdating ? 'opacity-50 cursor-not-allowed text-emerald-400' : ''
                                  }`}
                                  title="Actualizar Precios con IA Online"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${isPriceUpdating ? 'animate-spin' : ''}`} />
                                </button>

                                {/* Edit card details */}
                                <button
                                  onClick={() => setEditingCard(card)}
                                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/20 transition-all"
                                  title="Editar Manualmente"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete card */}
                                <button
                                  onClick={() => deleteCard(card.id)}
                                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-650 hover:text-rose-450 hover:text-rose-450 transition-all"
                                  title="Eliminar de mi catálogo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded insights sub-frame */}
                          {isExpanded && (
                            <tr className="bg-[#08090d] border-t border-b border-zinc-900/50">
                              <td colSpan={8} className="py-4 px-6 text-left">
                                <div className="space-y-3 max-w-4xl font-sans animate-fadeIn">
                                  <h5 className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5 font-sans">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Análisis Técnico & Valuación (Gemini AI Expert)
                                  </h5>
                                  <p className="text-xs text-zinc-300 font-normal leading-relaxed">
                                    {card.insight}
                                  </p>
                                  <div className="text-[9px] text-zinc-500 block pt-1 font-mono uppercase tracking-wider">
                                    Fecha de consulta: {new Date(card.scannedAt).toLocaleDateString('es-MX')} {new Date(card.scannedAt).toLocaleTimeString('es-MX')}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* GRID OF CARDS IN PORTFOLIO - HIGH QUALITY DESIGNED INTERACTIVE CARDS */
              <div id="grid-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {filteredCollection.map(card => {
                  const isExpanded = expandedCardId === card.id;
                  const isPriceUpdating = updatingPriceCardId === card.id;
                  const itemValueMin = card.minPrice * card.quantity;
                  const itemValueMax = card.maxPrice * card.quantity;
                  
                  return (
                    <div 
                      key={card.id} 
                      id={`card-elem-${card.id}`}
                      className="bg-[#0b0c12] border border-zinc-900 rounded-2xl overflow-hidden hover:border-emerald-500/25 transition-all duration-300 group shadow-lg flex flex-col justify-between"
                    >
                      {/* Card Header graphic layout */}
                      <div className="p-5 space-y-4">
                        
                        {/* Status indicators */}
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                            {card.sport}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {card.notes.toLowerCase().includes('rookie') || card.notes.toLowerCase().includes('rc') ? (
                              <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 shadow-sm">
                                Rookie (RC)
                              </span>
                            ) : card.notes.toLowerCase().includes('hof') ? (
                              <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-indigo-500 text-white shadow-sm">
                                HOF
                              </span>
                            ) : (
                              <span className="text-[9px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                {card.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Player name, Set and Card number info */}
                        <div className="flex gap-3">
                          {card.image && (
                            <img 
                              src={card.image} 
                              alt={card.player} 
                              className="w-12 h-12 object-cover rounded-lg border border-zinc-800 shrink-0" 
                              referrerPolicy="no-referrer" 
                            />
                          )}
                          <div className="overflow-hidden">
                            <p className="text-[10px] text-zinc-500 font-medium tracking-wide truncate">{card.team}</p>
                            <h4 className="text-base font-black text-white group-hover:text-emerald-400 tracking-tight transition-all mt-0.5 truncate">{card.player}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-emerald-400/90 font-semibold font-sans">{card.set} {card.year}</span>
                              <span className="text-zinc-700 text-[10px]">•</span>
                              <span className="text-zinc-400 text-xs font-medium font-mono">Tarj #{card.cardNumber}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Quantity and valuation panel nested */}
                        <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                          
                          {/* Left: Copies counter */}
                          <div className="flex flex-col justify-center">
                            <span className="text-[9px] text-zinc-500 uppercase font-semibold">Cantidad</span>
                            <div className="flex items-center gap-2.5 mt-1">
                              <button 
                                onClick={() => updateQuantity(card.id, -1)}
                                className="text-zinc-500 hover:text-amber-500 transition-all focus:outline-none"
                                title="Restar copia"
                              >
                                <MinusCircle className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-black text-white font-mono w-4 text-center">{card.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(card.id, 1)}
                                className="text-zinc-500 hover:text-emerald-400 transition-all focus:outline-none"
                                title="Sumar copia"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Right: Price box */}
                          <div className="text-right">
                            <span className="text-[9px] text-emerald-400 uppercase font-bold">Valuación</span>
                            <div className="text-xs font-extrabold text-white mt-1">
                              ${card.minPrice.toFixed(1)} - ${card.maxPrice.toFixed(1)} <span className="text-[9px] text-zinc-500 font-normal">c/u</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-medium mt-0.5 font-mono">
                              Tot: ${itemValueMin.toFixed(1)} - ${itemValueMax.toFixed(1)} USD
                            </div>
                          </div>
                        </div>

                        {/* Hidden Detail Dropdown Area */}
                        {isExpanded && (
                          <div className="space-y-2 pt-2 border-t border-zinc-900 animate-fadeIn font-sans">
                            <h5 className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Análisis de Mercado Gemini:
                            </h5>
                            <p className="text-xs text-zinc-300 font-normal leading-relaxed text-slate-300/95">
                              {card.insight}
                            </p>
                            <div className="text-[10px] text-zinc-500 block pt-1 font-mono">
                              Subido al sistema: {new Date(card.scannedAt).toLocaleDateString('es-MX')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card low footer row */}
                      <div className="px-5 py-3.5 bg-zinc-950/60 border-t border-zinc-900/60 flex items-center justify-between">
                        <button
                          onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                          className="text-[11px] text-zinc-400 hover:text-emerald-400 font-semibold flex items-center gap-1 transition-all"
                        >
                          {isExpanded ? (
                            <>Ocultar Detalles <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Ver Insights IA <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          {/* Actualizar precio online */}
                          <button
                            onClick={() => handleUpdatePriceOnline(card.id)}
                            disabled={isPriceUpdating}
                            className={`p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-400 transition-all ${
                              isPriceUpdating ? 'opacity-50 cursor-not-allowed text-emerald-400' : ''
                            }`}
                            title="Actualizar Precios Online"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isPriceUpdating ? 'animate-spin' : ''}`} />
                          </button>

                          {/* Editar tarjeta */}
                          <button 
                            onClick={() => setEditingCard(card)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition-all font-semibold"
                            title="Editar Datos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button 
                            onClick={() => deleteCard(card.id)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-rose-450 hover:text-rose-400 transition-all focus:outline-none"
                            title="Eliminar de mi colección"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Simple cohesive footer */}
      <footer className="mt-auto border-t border-zinc-900/80 py-6 px-4 bg-[#0a0b10] text-[#555a6c]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 GigaComps AI. Con tecnología de Google Gemini y algoritmos deportivos maestros.</p>
          <div className="flex gap-4">
            <span className="text-emerald-500/80 font-bold flex items-center gap-1">
              ● Servidores de Base de Datos Activos
            </span>
            <span>Port 3000 Secured</span>
          </div>
        </div>
      </footer>

      {/* EDIT MODAL DIALOG POPUP */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c13] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative font-sans text-zinc-350 animate-fadeIn">
            
            <button 
              onClick={() => setEditingCard(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Editar Tarjeta Deportiva
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Ajusta los metadatos o actualiza el precio en vivo usando grounding de subastas e Internet.</p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] text-zinc-550 block mb-1 font-bold uppercase tracking-wider text-zinc-400">Atleta / Jugador</label>
                  <input 
                    type="text" 
                    value={editingCard.player}
                    onChange={(e) => setEditingCard({ ...editingCard, player: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-550 block mb-1 font-bold uppercase tracking-wider text-zinc-400">Equipo</label>
                  <input 
                    type="text" 
                    value={editingCard.team}
                    onChange={(e) => setEditingCard({ ...editingCard, team: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider text-zinc-400">Año de Edición</label>
                  <input 
                    type="text" 
                    value={editingCard.year}
                    onChange={(e) => setEditingCard({ ...editingCard, year: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider text-zinc-400">Set o Marca</label>
                  <input 
                    type="text" 
                    value={editingCard.set}
                    onChange={(e) => setEditingCard({ ...editingCard, set: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider text-zinc-400">Nº de Tarjeta</label>
                  <input 
                    type="text" 
                    value={editingCard.cardNumber}
                    onChange={(e) => setEditingCard({ ...editingCard, cardNumber: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider text-zinc-400">Deporte</label>
                  <select 
                    value={editingCard.sport}
                    onChange={(e) => setEditingCard({ ...editingCard, sport: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Baseball">Béisbol</option>
                    <option value="Basketball">Baloncesto</option>
                    <option value="Football">Fútbol Americano</option>
                    <option value="Soccer">Fútbol</option>
                    <option value="Other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider text-zinc-400">Atributos / Notas</label>
                  <input 
                    type="text" 
                    value={editingCard.notes}
                    onChange={(e) => setEditingCard({ ...editingCard, notes: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider text-zinc-400">Precio Mínimo (USD)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingCard.minPrice}
                    onChange={(e) => setEditingCard({ ...editingCard, minPrice: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider text-zinc-400">Precio Máximo (USD)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingCard.maxPrice}
                    onChange={(e) => setEditingCard({ ...editingCard, maxPrice: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider text-zinc-400">Cantidad (Copias Disponibles)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={editingCard.quantity}
                    onChange={(e) => setEditingCard({ ...editingCard, quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider text-zinc-400">Análisis e Insights (Sugerido por IA)</label>
                <textarea 
                  rows={3}
                  value={editingCard.insight}
                  onChange={(e) => setEditingCard({ ...editingCard, insight: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-900 justify-between items-center">
              <button
                type="button"
                disabled={updatingPriceCardId === editingCard.id}
                onClick={() => handleUpdatePriceOnline(editingCard.id)}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:hover:bg-emerald-500/10 text-emerald-400 font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updatingPriceCardId === editingCard.id ? 'animate-spin' : ''}`} />
                {updatingPriceCardId === editingCard.id ? 'Consultando IA...' : 'Actualizar Precios Online / Comps'}
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="w-1/2 sm:w-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-bold text-zinc-400 hover:text-white rounded-xl transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditCard(editingCard)}
                  className="w-1/2 sm:w-auto px-5 py-2 bg-emerald-500 hover:bg-emerald-400 font-black text-zinc-950 rounded-xl transition-all text-xs shadow-md shadow-emerald-500/10"
                >
                  Guardar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM ACTION DIALOG (Saves iframe from sandbox confirm errors) */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0b0c13] border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl relative font-sans animate-fadeIn">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {confirmModal.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-bold text-zinc-400 hover:text-white rounded-xl transition-all text-xs"
              >
                {confirmModal.cancelText || "Cancelar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal && typeof confirmModal.onConfirm === 'function') {
                    try {
                      confirmModal.onConfirm();
                    } catch (e) {
                      console.error("Error running dialog confirm action", e);
                    }
                  }
                }}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 font-black text-zinc-950 rounded-xl transition-all text-xs shadow-md shadow-emerald-500/10"
              >
                {confirmModal.confirmText || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION TOAST NOTIFICATIONS */}
      {appNotification && (
        <div className="fixed bottom-6 right-6 z-[120] max-w-sm w-full bg-[#0d0f17] border border-zinc-800 rounded-xl p-4 shadow-2xl flex items-start gap-3 animate-slideIn select-none">
          <div className="shrink-0 mt-0.5">
            {appNotification.type === 'success' && (
              <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            {appNotification.type === 'error' && (
              <div className="bg-rose-500/10 text-rose-400 p-1.5 rounded-lg border border-rose-500/20">
                <X className="w-4 h-4" />
              </div>
            )}
            {appNotification.type === 'warning' && (
              <div className="bg-amber-500/10 text-amber-400 p-1.5 rounded-lg border border-amber-500/20">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {appNotification.type === 'info' && (
              <div className="bg-zinc-850 text-zinc-300 p-1.5 rounded-lg border border-zinc-700">
                <Database className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white capitalize">
              {appNotification.type === 'success' ? 'Éxito' : appNotification.type === 'error' ? 'Error' : appNotification.type === 'warning' ? 'Advertencia' : 'Información'}
            </p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {appNotification.message}
            </p>
          </div>
          <button
            onClick={() => setAppNotification(null)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
