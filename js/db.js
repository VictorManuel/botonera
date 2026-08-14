const DB_NAME = "botonera-db";
const DB_VERSION = 1;
const BUTTONS_STORE = "buttons";
const SOUNDS_STORE = "sounds";

let databasePromise;

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error), { once: true });
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", resolve, { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("Transacción cancelada")), {
      once: true,
    });
    transaction.addEventListener("error", () => reject(transaction.error), { once: true });
  });
}

export function openDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.addEventListener("upgradeneeded", () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(BUTTONS_STORE)) {
          const buttons = db.createObjectStore(BUTTONS_STORE, { keyPath: "id" });
          buttons.createIndex("order", "order", { unique: false });
        }
        if (!db.objectStoreNames.contains(SOUNDS_STORE)) {
          db.createObjectStore(SOUNDS_STORE, { keyPath: "id" });
        }
      });

      request.addEventListener("success", () => resolve(request.result), { once: true });
      request.addEventListener("error", () => reject(request.error), { once: true });
      request.addEventListener("blocked", () => reject(new Error("La base local está bloqueada por otra pestaña")), {
        once: true,
      });
    });
  }

  return databasePromise;
}

export async function getButtons() {
  const db = await openDatabase();
  const transaction = db.transaction(BUTTONS_STORE, "readonly");
  const done = transactionDone(transaction);
  const records = await requestToPromise(transaction.objectStore(BUTTONS_STORE).getAll());
  await done;
  return records.sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export async function getSound(id) {
  const db = await openDatabase();
  const transaction = db.transaction(SOUNDS_STORE, "readonly");
  const done = transactionDone(transaction);
  const record = await requestToPromise(transaction.objectStore(SOUNDS_STORE).get(id));
  await done;
  return record || null;
}

export async function addSoundButton(button, blob) {
  const db = await openDatabase();
  const transaction = db.transaction([BUTTONS_STORE, SOUNDS_STORE], "readwrite");
  transaction.objectStore(BUTTONS_STORE).add(button);
  transaction.objectStore(SOUNDS_STORE).add({ id: button.id, blob });
  await transactionDone(transaction);
}

export async function updateButton(button) {
  const db = await openDatabase();
  const transaction = db.transaction(BUTTONS_STORE, "readwrite");
  transaction.objectStore(BUTTONS_STORE).put(button);
  await transactionDone(transaction);
}

export async function deleteSoundButton(id) {
  const db = await openDatabase();
  const transaction = db.transaction([BUTTONS_STORE, SOUNDS_STORE], "readwrite");
  transaction.objectStore(BUTTONS_STORE).delete(id);
  transaction.objectStore(SOUNDS_STORE).delete(id);
  await transactionDone(transaction);
}

export async function getAllWithSounds() {
  const buttons = await getButtons();
  const soundRecords = await Promise.all(buttons.map((button) => getSound(button.id)));
  return buttons.map((button, index) => ({ button, blob: soundRecords[index]?.blob })).filter((item) => item.blob);
}

export async function replaceSoundboard(items) {
  const db = await openDatabase();
  const transaction = db.transaction([BUTTONS_STORE, SOUNDS_STORE], "readwrite");
  const buttonsStore = transaction.objectStore(BUTTONS_STORE);
  const soundsStore = transaction.objectStore(SOUNDS_STORE);
  buttonsStore.clear();
  soundsStore.clear();

  for (const { button, blob } of items) {
    buttonsStore.add(button);
    soundsStore.add({ id: button.id, blob });
  }

  await transactionDone(transaction);
}
