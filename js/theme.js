// Copyright 2026 Victor M Lorenzo · SPDX-License-Identifier: Apache-2.0

export const DEFAULT_THEME = "digital";
export const THEME_STORAGE_KEY = "botonera.visual-theme.v1";

export const THEMES = Object.freeze([
  { id: "digital", label: "Digital", themeColor: "#11100f" },
  { id: "cartoon", label: "Cartoon", themeColor: "#f8e9b8" },
]);

export function isKnownTheme(theme) {
  return THEMES.some((item) => item.id === theme);
}

export function readTheme(storage = globalThis.localStorage) {
  try {
    const savedTheme = storage?.getItem(THEME_STORAGE_KEY);
    return isKnownTheme(savedTheme) ? savedTheme : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme, storage = globalThis.localStorage) {
  const nextTheme = isKnownTheme(theme) ? theme : DEFAULT_THEME;
  try {
    storage?.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // The theme still applies for this visit when storage is unavailable.
  }
  return nextTheme;
}

export function applyTheme(theme, root = globalThis.document?.documentElement) {
  const nextTheme = isKnownTheme(theme) ? theme : DEFAULT_THEME;
  if (root) root.dataset.theme = nextTheme;
  return nextTheme;
}
