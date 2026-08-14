import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_MODE,
  getMode,
  labelFromFilename,
  MODES,
  readModes,
  removeMode,
  replaceModes,
  setMode,
} from "../js/config.js";

class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.get(key) ?? null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }
}

test("persiste y recupera un modo por botón", () => {
  const storage = new MemoryStorage();
  assert.equal(getMode("uno", storage), DEFAULT_MODE);
  setMode("uno", MODES.LOOP, storage);
  assert.equal(getMode("uno", storage), MODES.LOOP);
  removeMode("uno", storage);
  assert.equal(getMode("uno", storage), DEFAULT_MODE);
});

test("descarta configuraciones corruptas o modos desconocidos", () => {
  const storage = new MemoryStorage();
  storage.setItem("botonera.button-modes.v1", "no-es-json");
  assert.deepEqual(readModes(storage), {});
  replaceModes({ uno: MODES.HOLD, dos: "invalido" }, storage);
  assert.deepEqual(readModes(storage), { uno: MODES.HOLD });
});

test("genera etiquetas legibles desde nombres de archivo", () => {
  assert.equal(labelFromFilename("aplausos_final-01.mp3"), "aplausos final 01");
  assert.equal(labelFromFilename(".wav"), "Sonido");
  assert.equal(labelFromFilename(""), "Sonido");
});
