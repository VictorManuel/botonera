export const MODES = Object.freeze({
  ONESHOT: "oneshot",
  HOLD: "hold",
  LOOP: "loop",
});

export const VALID_MODES = new Set(Object.values(MODES));
export const DEFAULT_MODE = MODES.ONESHOT;
export const MODES_STORAGE_KEY = "botonera.button-modes.v1";

export const MODE_HINTS = Object.freeze({
  [MODES.ONESHOT]: "Tocá para reproducir completo",
  [MODES.HOLD]: "Mantené presionado para reproducir",
  [MODES.LOOP]: "Tocá para iniciar o detener el loop",
});

export function readModes(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(MODES_STORAGE_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([id, mode]) => typeof id === "string" && VALID_MODES.has(mode)),
    );
  } catch {
    return {};
  }
}

export function getMode(buttonId, storage = globalThis.localStorage) {
  return readModes(storage)[buttonId] || DEFAULT_MODE;
}

export function setMode(buttonId, mode, storage = globalThis.localStorage) {
  if (!VALID_MODES.has(mode)) throw new TypeError(`Modo no válido: ${mode}`);
  const modes = readModes(storage);
  modes[buttonId] = mode;
  storage.setItem(MODES_STORAGE_KEY, JSON.stringify(modes));
  return mode;
}

export function removeMode(buttonId, storage = globalThis.localStorage) {
  const modes = readModes(storage);
  delete modes[buttonId];
  storage.setItem(MODES_STORAGE_KEY, JSON.stringify(modes));
}

export function replaceModes(nextModes, storage = globalThis.localStorage) {
  const sanitized = Object.fromEntries(
    Object.entries(nextModes || {}).filter(([id, mode]) => typeof id === "string" && VALID_MODES.has(mode)),
  );
  storage.setItem(MODES_STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function labelFromFilename(filename) {
  const withoutExtension = String(filename || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (withoutExtension || "Sonido").slice(0, 42);
}
