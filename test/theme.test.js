import assert from "node:assert/strict";
import test from "node:test";
import { applyTheme, DEFAULT_THEME, readTheme, saveTheme, THEMES } from "../js/theme.js";

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

test("registra Digital y Cartoon como temas disponibles", () => {
  assert.deepEqual(THEMES.map((theme) => theme.id), ["digital", "cartoon"]);
});

test("persiste un tema conocido y descarta valores inválidos", () => {
  const storage = new MemoryStorage();
  assert.equal(readTheme(storage), DEFAULT_THEME);
  assert.equal(saveTheme("cartoon", storage), "cartoon");
  assert.equal(readTheme(storage), "cartoon");
  storage.setItem("botonera.visual-theme.v1", "desconocido");
  assert.equal(readTheme(storage), DEFAULT_THEME);
});

test("aplica el tema como atributo de la raíz", () => {
  const root = { dataset: {} };
  assert.equal(applyTheme("cartoon", root), "cartoon");
  assert.equal(root.dataset.theme, "cartoon");
  assert.equal(applyTheme("otro", root), DEFAULT_THEME);
  assert.equal(root.dataset.theme, DEFAULT_THEME);
});
