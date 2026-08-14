import { AudioEngine } from "./audio-engine.js";
import { createBackup, parseBackup } from "./backup.js";
import {
  addSoundButton,
  deleteSoundButton,
  getAllWithSounds,
  getButtons,
  getSound,
  openDatabase,
  replaceSoundboard,
  updateButton,
} from "./db.js";
import {
  getMode,
  labelFromFilename,
  MODE_HINTS,
  MODES,
  readModes,
  removeMode,
  replaceModes,
  setMode,
} from "./config.js";

const ACCENTS = ["#ff5a36", "#d8ff5e", "#ffd166", "#79d9ff", "#ff8ac7", "#b8a0ff"];

const state = {
  buttons: [],
  editingId: null,
  holdPointers: new Map(),
  keyboardHolds: new Set(),
  deferredInstallPrompt: null,
  toastTimer: null,
};

const elements = {
  audioInput: document.querySelector("#audio-input"),
  backupInput: document.querySelector("#backup-input"),
  soundGrid: document.querySelector("#sound-grid"),
  template: document.querySelector("#sound-card-template"),
  emptyState: document.querySelector("#empty-state"),
  soundCount: document.querySelector("#sound-count"),
  storageUsed: document.querySelector("#storage-used"),
  stopAll: document.querySelector("#stop-all"),
  editDialog: document.querySelector("#edit-dialog"),
  editForm: document.querySelector("#edit-form"),
  editLabel: document.querySelector("#edit-label"),
  deleteSound: document.querySelector("#delete-sound"),
  dataDialog: document.querySelector("#data-dialog"),
  installDialog: document.querySelector("#install-dialog"),
  installButton: document.querySelector("#install-button"),
  networkPill: document.querySelector("#network-pill"),
  networkLabel: document.querySelector("#network-label"),
  loadingOverlay: document.querySelector("#loading-overlay"),
  loadingTitle: document.querySelector("#loading-title"),
  loadingDetail: document.querySelector("#loading-detail"),
  toast: document.querySelector("#toast"),
};

const audio = new AudioEngine((id, isPlaying) => updatePlayingState(id, isPlaying));

function generateId() {
  return globalThis.crypto?.randomUUID?.() || `sound-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showToast(message, duration = 3200) {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  state.toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, duration);
}

function setLoading(visible, title = "Procesando sonidos…", detail = "Esto puede tardar unos segundos.") {
  elements.loadingTitle.textContent = title;
  elements.loadingDetail.textContent = detail;
  elements.loadingOverlay.hidden = !visible;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function getButton(id) {
  return state.buttons.find((button) => button.id === id);
}

function updatePlayingState(id, isPlaying) {
  const card = elements.soundGrid.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (card) {
    card.classList.toggle("is-playing", isPlaying);
    const pad = card.querySelector(".sound-pad");
    pad.setAttribute("aria-pressed", String(isPlaying));
    const mode = getMode(id);
    pad.querySelector(".sound-hint").textContent = isPlaying
      ? mode === MODES.LOOP
        ? "Reproduciendo en loop · tocá para detener"
        : "Reproduciendo · tocá para reiniciar"
      : MODE_HINTS[mode];
  }
  elements.stopAll.disabled = audio.active.size === 0;
}

function render() {
  elements.soundGrid.replaceChildren();
  state.buttons.forEach((button, index) => elements.soundGrid.append(createSoundCard(button, index)));
  const isEmpty = state.buttons.length === 0;
  elements.emptyState.hidden = !isEmpty;
  elements.soundCount.textContent = String(state.buttons.length);
  elements.storageUsed.textContent = formatBytes(state.buttons.reduce((sum, button) => sum + (button.size || 0), 0));
  elements.stopAll.disabled = audio.active.size === 0;
}

function createSoundCard(button, index) {
  const card = elements.template.content.firstElementChild.cloneNode(true);
  const mode = getMode(button.id);
  card.dataset.id = button.id;
  const accentIndex = ((button.accent % ACCENTS.length) + ACCENTS.length) % ACCENTS.length;
  card.style.setProperty("--accent", ACCENTS[accentIndex]);
  card.querySelector(".card-number").textContent = String(index + 1).padStart(2, "0");
  card.querySelector(".sound-name").textContent = button.label;
  card.querySelector(".sound-hint").textContent = MODE_HINTS[mode];

  const pad = card.querySelector(".sound-pad");
  pad.dataset.id = button.id;
  pad.setAttribute("aria-label", `${button.label}. ${MODE_HINTS[mode]}`);
  pad.setAttribute("aria-pressed", "false");
  bindPadEvents(pad, button.id);

  card.querySelector(".edit-button").addEventListener("click", () => openEditDialog(button.id));
  card.querySelectorAll("[data-mode]").forEach((modeButton) => {
    const isSelected = modeButton.dataset.mode === mode;
    modeButton.classList.toggle("is-selected", isSelected);
    modeButton.setAttribute("aria-pressed", String(isSelected));
    modeButton.addEventListener("click", () => changeMode(button.id, modeButton.dataset.mode));
  });

  return card;
}

function bindPadEvents(pad, id) {
  pad.addEventListener("pointerdown", async (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    pad.setPointerCapture?.(event.pointerId);
    const mode = getMode(id);

    if (mode === MODES.HOLD) state.holdPointers.set(event.pointerId, id);
    await activateButton(id, mode);

    if (mode === MODES.HOLD && state.holdPointers.get(event.pointerId) !== id) audio.stop(id);
  });

  const release = (event) => {
    if (state.holdPointers.get(event.pointerId) === id) {
      state.holdPointers.delete(event.pointerId);
      audio.stop(id);
    }
  };
  pad.addEventListener("pointerup", release);
  pad.addEventListener("pointercancel", release);
  pad.addEventListener("lostpointercapture", release);

  pad.addEventListener("keydown", async (event) => {
    if (!["Enter", " "].includes(event.key) || event.repeat) return;
    event.preventDefault();
    const mode = getMode(id);
    if (mode === MODES.HOLD) state.keyboardHolds.add(id);
    await activateButton(id, mode);
  });

  pad.addEventListener("keyup", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (state.keyboardHolds.delete(id)) audio.stop(id);
  });
}

async function activateButton(id, mode) {
  try {
    await audio.unlock();
    if (mode === MODES.LOOP && audio.isPlaying(id)) {
      audio.stop(id);
      return;
    }

    const soundRecord = await getSound(id);
    if (!soundRecord?.blob) throw new Error("No se encontró el archivo de audio");
    await audio.play(id, soundRecord.blob, { loop: mode === MODES.LOOP });
  } catch (error) {
    console.error(error);
    showToast("No pudimos reproducir este archivo. Probá con otro formato.");
  }
}

function changeMode(id, mode) {
  audio.stop(id);
  setMode(id, mode);
  render();
  const button = getButton(id);
  showToast(`${button?.label || "Sonido"}: modo ${mode === MODES.ONESHOT ? "completo" : mode === MODES.HOLD ? "mantener" : "loop"}`);
}

function openEditDialog(id) {
  const button = getButton(id);
  if (!button) return;
  state.editingId = id;
  elements.editLabel.value = button.label;
  elements.editDialog.showModal();
  requestAnimationFrame(() => elements.editLabel.select());
}

async function importAudioFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  setLoading(true, "Cargando sonidos…", `Preparando ${files.length} archivo${files.length === 1 ? "" : "s"}.`);
  let imported = 0;
  const rejected = [];

  try {
    let nextOrder = state.buttons.length;
    for (const [index, file] of files.entries()) {
      elements.loadingDetail.textContent = `${index + 1} de ${files.length}: ${file.name}`;
      try {
        if (!file.size) throw new Error("El archivo está vacío");
        const id = generateId();
        await audio.prepare(id, file);
        const now = new Date().toISOString();
        await addSoundButton(
          {
            id,
            label: labelFromFilename(file.name),
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            createdAt: now,
            order: nextOrder,
            accent: nextOrder % ACCENTS.length,
          },
          file,
        );
        setMode(id, MODES.ONESHOT);
        nextOrder += 1;
        imported += 1;
      } catch (error) {
        console.error(`No se pudo importar ${file.name}`, error);
        rejected.push(file.name);
      }
    }

    if (imported) {
      await requestPersistentStorage();
      await refreshButtons();
      showToast(`${imported} sonido${imported === 1 ? " agregado" : "s agregados"}.`);
    }
    if (rejected.length) showToast(`No se pudieron leer: ${rejected.join(", ")}`, 5200);
  } finally {
    setLoading(false);
    elements.audioInput.value = "";
  }
}

async function refreshButtons() {
  state.buttons = await getButtons();
  render();
}

async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch {
    // Storage remains usable even if persistent mode is not granted.
  }
}

async function exportBackup() {
  if (!state.buttons.length) {
    showToast("Agregá al menos un sonido antes de exportar.");
    return;
  }

  setLoading(true, "Preparando respaldo…", "Incluyendo los archivos de audio.");
  try {
    const backup = await createBackup(await getAllWithSounds(), readModes());
    const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `botonera-${new Date().toISOString().slice(0, 10)}.botonera.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    elements.dataDialog.close();
    showToast("Respaldo descargado.");
  } catch (error) {
    console.error(error);
    showToast("No pudimos crear el respaldo.");
  } finally {
    setLoading(false);
  }
}

async function importBackupFile(file) {
  if (!file) return;
  if (state.buttons.length && !confirm("Importar este respaldo reemplazará toda la botonera actual. ¿Continuar?")) {
    elements.backupInput.value = "";
    return;
  }

  setLoading(true, "Importando respaldo…", "Validando botones y archivos de audio.");
  try {
    const parsed = parseBackup(await file.text());
    for (const [index, item] of parsed.items.entries()) {
      elements.loadingDetail.textContent = `Validando ${index + 1} de ${parsed.items.length}: ${item.button.label}`;
      await audio.validate(item.blob);
    }
    audio.clear();
    await replaceSoundboard(parsed.items);
    replaceModes(parsed.modes);
    await requestPersistentStorage();
    await refreshButtons();
    elements.dataDialog.close();
    showToast("Respaldo importado correctamente.");
  } catch (error) {
    console.error(error);
    showToast(error.message || "No pudimos importar el respaldo.", 5200);
  } finally {
    setLoading(false);
    elements.backupInput.value = "";
  }
}

function updateNetworkStatus() {
  const online = navigator.onLine;
  elements.networkPill.classList.toggle("offline", !online);
  elements.networkLabel.textContent = online ? "En línea" : "Modo offline";
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (error) {
    console.error("No se pudo registrar el service worker", error);
  }
}

function bindGlobalEvents() {
  ["#add-sounds-hero", "#add-sounds-toolbar", "#add-sounds-empty", "#floating-add"].forEach((selector) => {
    document.querySelector(selector).addEventListener("click", () => elements.audioInput.click());
  });
  elements.audioInput.addEventListener("change", () => importAudioFiles(elements.audioInput.files));

  elements.stopAll.addEventListener("click", () => audio.stopAll());
  document.querySelector("#open-data-dialog").addEventListener("click", () => elements.dataDialog.showModal());
  document.querySelector("#close-data-dialog").addEventListener("click", () => elements.dataDialog.close());
  document.querySelector("#export-backup").addEventListener("click", exportBackup);
  document.querySelector("#import-backup").addEventListener("click", () => elements.backupInput.click());
  elements.backupInput.addEventListener("change", () => importBackupFile(elements.backupInput.files[0]));

  document.querySelector("#show-install-help").addEventListener("click", () => elements.installDialog.showModal());
  document.querySelector("#close-install-dialog").addEventListener("click", () => elements.installDialog.close());

  elements.editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = getButton(state.editingId);
    const label = elements.editLabel.value.trim();
    if (!button || !label) return;
    button.label = label.slice(0, 42);
    await updateButton(button);
    elements.editDialog.close();
    state.editingId = null;
    render();
    showToast("Nombre actualizado.");
  });

  elements.deleteSound.addEventListener("click", async () => {
    const id = state.editingId;
    const button = getButton(id);
    if (!button || !confirm(`¿Eliminar “${button.label}” y su archivo de audio?`)) return;
    audio.forget(id);
    await deleteSoundButton(id);
    removeMode(id);
    elements.editDialog.close();
    state.editingId = null;
    await refreshButtons();
    showToast("Sonido eliminado.");
  });

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    elements.installButton.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    state.deferredInstallPrompt = null;
    elements.installButton.hidden = true;
    showToast("Botonera instalada.");
  });
  elements.installButton.addEventListener("click", async () => {
    if (!state.deferredInstallPrompt) {
      elements.installDialog.showModal();
      return;
    }
    await state.deferredInstallPrompt.prompt();
    state.deferredInstallPrompt = null;
    elements.installButton.hidden = true;
  });

  window.addEventListener("blur", () => {
    for (const id of new Set(state.holdPointers.values())) audio.stop(id);
    for (const id of state.keyboardHolds) audio.stop(id);
    state.holdPointers.clear();
    state.keyboardHolds.clear();
  });
}

async function initialize() {
  bindGlobalEvents();
  updateNetworkStatus();
  await registerServiceWorker();

  try {
    await openDatabase();
    await refreshButtons();
  } catch (error) {
    console.error(error);
    showToast("No pudimos abrir el almacenamiento local. Revisá los permisos del navegador.", 5200);
  }
}

initialize();
