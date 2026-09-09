// Copyright 2026 Victor M Lorenzo · SPDX-License-Identifier: Apache-2.0

export class AudioEngine {
  constructor(onStateChange = () => {}) {
    this.context = null;
    this.buffers = new Map();
    this.active = new Map();
    this.onStateChange = onStateChange;
  }

  get AudioContextClass() {
    return globalThis.AudioContext || globalThis.webkitAudioContext;
  }

  async unlock() {
    if (!this.AudioContextClass) throw new Error("Este navegador no admite Web Audio");
    if (!this.context) this.context = new this.AudioContextClass();
    if (this.context.state === "suspended") await this.context.resume();
    return this.context;
  }

  async prepare(id, blob) {
    if (this.buffers.has(id)) return this.buffers.get(id);
    const context = await this.unlock();
    const audioBuffer = await context.decodeAudioData(await blob.arrayBuffer());
    this.buffers.set(id, audioBuffer);
    return audioBuffer;
  }

  async validate(blob) {
    const context = await this.unlock();
    await context.decodeAudioData(await blob.arrayBuffer());
    return true;
  }

  async play(id, blob, { loop = false } = {}) {
    const context = await this.unlock();
    const buffer = await this.prepare(id, blob);
    this.stop(id);

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gain);
    gain.connect(context.destination);

    const entry = { source, gain, loop };
    this.active.set(id, entry);
    source.addEventListener(
      "ended",
      () => {
        if (this.active.get(id)?.source === source) {
          this.active.delete(id);
          this.onStateChange(id, false);
        }
      },
      { once: true },
    );

    source.start();
    this.onStateChange(id, true);
  }

  stop(id) {
    const entry = this.active.get(id);
    if (!entry) return false;
    this.active.delete(id);
    try {
      entry.source.stop();
    } catch {
      // The source may already have reached its natural end.
    }
    entry.source.disconnect();
    entry.gain.disconnect();
    this.onStateChange(id, false);
    return true;
  }

  stopAll() {
    for (const id of [...this.active.keys()]) this.stop(id);
  }

  isPlaying(id) {
    return this.active.has(id);
  }

  forget(id) {
    this.stop(id);
    this.buffers.delete(id);
  }

  clear() {
    this.stopAll();
    this.buffers.clear();
  }
}
