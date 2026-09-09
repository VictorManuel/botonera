// Copyright 2026 Victor M Lorenzo · SPDX-License-Identifier: Apache-2.0

import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = fileURLToPath(new URL("../dist/", import.meta.url));
const files = [
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "sw.js",
  "_headers",
  "LICENSE",
  "NOTICE",
  "ATTRIBUTION.md",
];
const directories = ["assets", "js"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of files) {
  await cp(new URL(`../${file}`, import.meta.url), new URL(`../dist/${file}`, import.meta.url));
}
for (const directory of directories) {
  await cp(new URL(`../${directory}/`, import.meta.url), new URL(`../dist/${directory}/`, import.meta.url), {
    recursive: true,
  });
}

console.log(`Sitio generado en ${output.replace(root, "")}`);
