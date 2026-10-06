import { parseDocument, type ArtDocument } from './editorModel';

async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ob-creative-studio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('documents');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readDesign(key: string): Promise<ArtDocument | null> {
  const db = await database();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction('documents').objectStore('documents').get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return value ? parseDocument(value) : null;
  } finally { db.close(); }
}
export async function writeDesign(key: string, doc: ArtDocument) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('documents', 'readwrite');
      transaction.objectStore('documents').put(doc, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Guardado cancelado.'));
    });
  } finally { db.close(); }
}
export async function imageFile(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('Selecciona una imagen PNG, JPG, WebP o GIF.');
  if (file.size > 15 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 15 MB.');
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('No se pudo leer la imagen.')); reader.readAsDataURL(file);
  });
  const image = new Image(); image.src = src;
  try { await image.decode(); } catch { throw new Error('El archivo no contiene una imagen válida.'); }
  if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error('La imagen es demasiado grande; reduce su resolución.');
  return src;
}
