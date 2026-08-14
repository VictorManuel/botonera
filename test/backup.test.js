import assert from "node:assert/strict";
import test from "node:test";
import { createBackup, parseBackup } from "../js/backup.js";

globalThis.atob ||= (value) => Buffer.from(value, "base64").toString("binary");
globalThis.btoa ||= (value) => Buffer.from(value, "binary").toString("base64");

test("exporta e importa un respaldo completo sin perder el audio", async () => {
  const original = new Blob(["audio de ida y vuelta"], { type: "audio/wav" });
  const backup = await createBackup(
    [
      {
        button: {
          id: "roundtrip",
          label: "Campana",
          fileName: "campana.wav",
          mimeType: "audio/wav",
          size: original.size,
          createdAt: "2026-08-14T00:00:00.000Z",
          order: 0,
          accent: 1,
        },
        blob: original,
      },
    ],
    { roundtrip: "hold" },
  );

  const restored = parseBackup(JSON.stringify(backup));
  assert.equal(await restored.items[0].blob.text(), "audio de ida y vuelta");
  assert.equal(restored.items[0].blob.type, "audio/wav");
  assert.deepEqual(restored.modes, { roundtrip: "hold" });
});

test("valida y reconstruye un respaldo", () => {
  const encoded = Buffer.from("audio de prueba").toString("base64");
  const result = parseBackup({
    application: "botonera-pwa",
    version: 1,
    buttons: [
      {
        id: "uno",
        label: "Aplausos",
        mode: "loop",
        fileName: "aplausos.mp3",
        order: 0,
        accent: 2,
        audio: { type: "audio/mpeg", base64: encoded },
      },
    ],
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].button.label, "Aplausos");
  assert.equal(result.items[0].blob.size, 15);
  assert.deepEqual(result.modes, { uno: "loop" });
});

test("rechaza respaldos incompatibles y botones repetidos", () => {
  assert.throws(() => parseBackup({ application: "otra", version: 1, buttons: [] }), /compatible/);
  const audio = { type: "audio/wav", base64: "YQ==" };
  assert.throws(
    () =>
      parseBackup({
        application: "botonera-pwa",
        version: 1,
        buttons: [
          { id: "x", label: "Uno", audio },
          { id: "x", label: "Dos", audio },
        ],
      }),
    /repetido/,
  );
});
