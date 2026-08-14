import { DEFAULT_MODE, VALID_MODES } from "./config.js";

export const BACKUP_VERSION = 1;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function base64ToBlob(base64, mimeType) {
  let binary;
  try {
    binary = atob(base64);
  } catch {
    throw new Error("El respaldo contiene audio codificado incorrectamente");
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

export async function createBackup(items, modes) {
  const buttons = [];
  for (const { button, blob } of items) {
    buttons.push({
      ...button,
      mode: VALID_MODES.has(modes[button.id]) ? modes[button.id] : DEFAULT_MODE,
      audio: {
        type: blob.type || button.mimeType || "application/octet-stream",
        base64: arrayBufferToBase64(await blob.arrayBuffer()),
      },
    });
  }

  return {
    application: "botonera-pwa",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    buttons,
  };
}

export function parseBackup(raw) {
  let data;
  try {
    data = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new Error("El archivo no contiene JSON válido");
  }

  if (data?.application !== "botonera-pwa" || data?.version !== BACKUP_VERSION || !Array.isArray(data.buttons)) {
    throw new Error("El archivo no es un respaldo compatible de Botonera");
  }

  const ids = new Set();
  const modes = {};
  const items = data.buttons.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`El botón ${index + 1} es inválido`);
    if (typeof entry.id !== "string" || !entry.id || ids.has(entry.id)) {
      throw new Error(`El botón ${index + 1} tiene un identificador inválido o repetido`);
    }
    if (typeof entry.label !== "string" || !entry.label.trim()) throw new Error(`El botón ${index + 1} no tiene nombre`);
    if (typeof entry.audio?.base64 !== "string" || entry.audio.base64.length === 0) {
      throw new Error(`El botón ${index + 1} no contiene audio`);
    }

    ids.add(entry.id);
    const mode = VALID_MODES.has(entry.mode) ? entry.mode : DEFAULT_MODE;
    modes[entry.id] = mode;
    const mimeType = typeof entry.audio.type === "string" ? entry.audio.type : "application/octet-stream";
    const blob = base64ToBlob(entry.audio.base64, mimeType);
    const button = {
      id: entry.id,
      label: entry.label.trim().slice(0, 42),
      fileName: typeof entry.fileName === "string" ? entry.fileName : `${entry.label}.audio`,
      mimeType,
      size: blob.size,
      createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
      order: Number.isFinite(entry.order) ? entry.order : index,
      accent: Number.isInteger(entry.accent) && entry.accent >= 0 ? entry.accent : index % 6,
    };
    return { button, blob };
  });

  return { items, modes };
}
