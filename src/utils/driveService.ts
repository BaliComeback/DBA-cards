export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
}

/**
 * Lists backups stored in the user's Google Drive.
 */
export const listBackups = async (accessToken: string): Promise<DriveBackupFile[]> => {
  const query = encodeURIComponent("name contains 'GigaComps_Backup_' and mimeType = 'application/json' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&orderBy=createdTime desc`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Error al listar archivos de Drive: ${res.status} ${res.statusText} (${errorBody})`);
  }
  
  const data = await res.json();
  return data.files || [];
};

/**
 * Creates and uploads a new JSON backup to Google Drive.
 */
export const uploadBackup = async (accessToken: string, collectionData: any[], fileName: string): Promise<string> => {
  // 1. Create Metadata
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: fileName,
      mimeType: 'application/json',
      description: 'Copia de seguridad del inventario de tarjetas deportivas de GigaComps AI.'
    })
  });
  
  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Error de metadatos de Drive: ${createRes.status} ${createRes.statusText} (${errorBody})`);
  }

  const fileMeta = await createRes.json();
  const fileId = fileMeta.id;

  // 2. Upload actual json contents
  const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(collectionData)
  });

  if (!uploadRes.ok) {
    const errorBody = await uploadRes.text();
    throw new Error(`Error de carga de Drive (media): ${uploadRes.status} ${uploadRes.statusText} (${errorBody})`);
  }

  return fileId;
};

/**
 * Downloads the content of a specific backup file.
 */
export const downloadBackup = async (accessToken: string, fileId: string): Promise<any[]> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Error de descarga de Drive: ${res.status} ${res.statusText} (${errorBody})`);
  }
  
  return await res.json();
};

/**
 * Deletes a file from Google Drive.
 */
export const deleteBackupFile = async (accessToken: string, fileId: string): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Error al eliminar archivo de Drive: ${res.status} ${res.statusText} (${errorBody})`);
  }
};
