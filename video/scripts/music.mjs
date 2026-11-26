/**
 * Original background music for the promo, synthesized from scratch (no samples, no licenses).
 * Warm pop in C major at ~107 BPM: pad, marimba-like arpeggio, bass, soft drums from the logo
 * reveal on, and bell chimes on the on-screen taps. Times below follow the scene timing in
 * src/Promo.tsx (30 fps); keep them in step if scenes change.
 *
 *   node scripts/music.mjs public/music.wav
 */
import { writeFileSync } from "node:fs";

const SR = 44100;
const LENGTH = 45.1; // seconds, = PROMO.durationInFrames / 30
const N = Math.ceil(LENGTH * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const sendL = new Float32Array(N); // reverb send
const sendR = new Float32Array(N);

const BAR = 2.25; // 4 beats → 106.7 BPM; the logo reveal (4.5 s) starts bar 3
const BEAT = BAR / 4;
const DRUMS_FROM = 4.5;
const END_CHORD = 40.5; // last bar rings out under the call to action

/** Frame → seconds. */
const f = (frame) => frame / 30;
/** Taps and reveals on screen (see Promo.tsx scene starts). */
const CHIMES = [f(210 + 114), f(342 + 108), f(469 + 46), f(626 + 20), f(626 + 60), f(783 + 66), f(1053 + 100)];
const CARD_POPS = [0, 1, 2, 3, 4, 5].map((i) => f(918 + 34 + i * 7));

const midi = (n) => 440 * 2 ** ((n - 69) / 12);
// I – V – vi – IV, one chord per bar (MIDI notes).
const CHORDS = [
  { root: 48, tones: [60, 64, 67, 71] }, // Cmaj7
  { root: 43, tones: [59, 62, 67, 74] }, // G
  { root: 45, tones: [60, 64, 69, 72] }, // Am
  { root: 41, tones: [60, 65, 69, 72] }, // Fmaj7(add)
];
const chordAt = (t) => CHORDS[Math.floor(t / BAR) % CHORDS.length];

function add(i, l, r, send = 0.25) {
  if (i < 0 || i >= N) return;
  L[i] += l;
  R[i] += r;
  sendL[i] += l * send;
  sendR[i] += r * send;
}

/** A note rendered sample by sample: osc(phaseTime) * envelope. */
function note({ start, dur, freq, gain, pan = 0, attack = 0.005, decay = 0.3, osc, send }) {
  const s0 = Math.floor(start * SR);
  const len = Math.floor((dur + decay * 6) * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const env = (t < attack ? t / attack : 1) * Math.exp(-Math.max(0, t - attack) / decay);
    if (env < 1e-4 && t > attack) break;
    const v = osc(t, freq) * env;
    add(s0 + k, v * gl, v * gr, send);
  }
}

const TAU = Math.PI * 2;
const marimba = (t, fr) => Math.sin(TAU * fr * t) + 0.25 * Math.sin(TAU * fr * 4 * t) * Math.exp(-t * 18) + 0.1 * Math.sin(TAU * fr * 10 * t) * Math.exp(-t * 40);
const bell = (t, fr) => Math.sin(TAU * fr * t) + 0.5 * Math.sin(TAU * fr * 2.76 * t) * Math.exp(-t * 3) + 0.25 * Math.sin(TAU * fr * 5.4 * t) * Math.exp(-t * 6);
const bassOsc = (t, fr) => Math.sin(TAU * fr * t) + 0.3 * Math.sin(TAU * fr * 2 * t);

// ---- Pad: slow, detuned, swelling chords for the whole piece ----
for (let bar = 0; bar * BAR < LENGTH; bar++) {
  const start = bar * BAR;
  const last = start >= END_CHORD - BAR;
  const c = last ? CHORDS[0] : chordAt(start);
  const dur = last ? LENGTH - start : BAR;
  for (const [j, n] of c.tones.entries()) {
    for (const det of [-0.12, 0.12]) {
      const fr = midi(n) * 2 ** (det / 12);
      const s0 = Math.floor(start * SR);
      const len = Math.floor(Math.min(dur + 0.6, LENGTH - start) * SR);
      for (let k = 0; k < len; k++) {
        const t = k / SR;
        const env = Math.min(1, t / 0.5) * Math.min(1, (dur + 0.6 - t) / 0.6) * (last ? Math.exp(-t / 2.2) : 1);
        const v = (Math.sin(TAU * fr * t) + Math.sin(TAU * fr * 3 * t) / 9) * env * 0.018;
        const pan = j % 2 ? 0.35 : -0.35;
        add(s0 + k, v * (1 - pan) * 0.7, v * (1 + pan) * 0.7, 0.5);
      }
    }
  }
}

// ---- Marimba arpeggio: 8th notes, quieter during the intro chat ----
const ARP = [0, 2, 1, 3, 2, 1, 3, 2];
for (let i = 0; i * (BEAT / 2) < END_CHORD; i++) {
  const t = i * (BEAT / 2);
  if (t < 0.4) continue;
  const c = chordAt(t);
  const n = c.tones[ARP[i % ARP.length]] + 12;
  const intro = t < DRUMS_FROM ? 0.6 : 1;
  const accent = i % 2 === 0 ? 1 : 0.7;
  note({ start: t, dur: 0.05, freq: midi(n), gain: 0.085 * intro * accent, pan: i % 2 ? 0.4 : -0.4, decay: 0.22, osc: marimba, send: 0.3 });
}

// ---- Bass: root on 1 and 3, a pickup on the "and" of 4 ----
for (let bar = Math.round(DRUMS_FROM / BAR); bar * BAR < END_CHORD; bar++) {
  const s = bar * BAR;
  const root = midi(chordAt(s).root);
  for (const [beat, g] of [[0, 1], [2, 0.8], [3.5, 0.55]]) {
    note({ start: s + beat * BEAT, dur: 0.1, freq: root, gain: 0.2 * g, decay: 0.35, attack: 0.01, osc: bassOsc, send: 0.05 });
  }
}
// Final low C under the end chord.
note({ start: END_CHORD, dur: 0.2, freq: midi(36), gain: 0.22, decay: 1.4, attack: 0.01, osc: bassOsc, send: 0.1 });

// ---- Drums ----
let seed = 7;
const noise = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x3fffffff) - 1;
function kick(start, gain) {
  const s0 = Math.floor(start * SR);
  let ph = 0;
  for (let k = 0; k < 0.3 * SR; k++) {
    const t = k / SR;
    ph += (TAU * (48 + 90 * Math.exp(-t * 30))) / SR;
    add(s0 + k, Math.sin(ph) * Math.exp(-t * 11) * gain, Math.sin(ph) * Math.exp(-t * 11) * gain, 0.02);
  }
}
function hiss(start, gain, decay, pan, tone) {
  // Differenced noise = brighter; `tone` mixes in a little body.
  const s0 = Math.floor(start * SR);
  let prev = 0;
  const gl = gain * (1 - pan);
  const gr = gain * (1 + pan);
  for (let k = 0; k < decay * 8 * SR; k++) {
    const t = k / SR;
    const nz = noise();
    const v = (nz - prev * (1 - tone)) * Math.exp(-t / decay);
    prev = nz;
    add(s0 + k, v * gl, v * gr, 0.15);
  }
}
for (let i = 0; DRUMS_FROM + i * (BEAT / 2) < END_CHORD; i++) {
  const t = DRUMS_FROM + i * (BEAT / 2);
  const beat = (i / 2) % 4;
  if (beat === 0 || beat === 2) kick(t, 0.32);
  if (beat === 1 || beat === 3) hiss(t, 0.05, 0.06, 0, 0.6); // soft snap
  hiss(t, i % 2 ? 0.018 : 0.012, 0.018, i % 2 ? 0.3 : -0.3, 0); // shaker
}
kick(END_CHORD, 0.3);

// ---- Chimes on taps, a rising note per size card, a sparkle at the logo ----
for (const t of CHIMES) {
  note({ start: t, dur: 0.05, freq: midi(chordAt(t).tones[3] + 24), gain: 0.05, decay: 0.5, osc: bell, send: 0.6 });
}
for (const [i, t] of CARD_POPS.entries()) {
  note({ start: t, dur: 0.05, freq: midi([72, 74, 76, 79, 81, 84][i]), gain: 0.05, decay: 0.35, osc: bell, pan: -0.5 + i * 0.2, send: 0.5 });
}
for (const [i, n] of [72, 76, 79, 84].entries()) {
  note({ start: DRUMS_FROM - 0.32 + i * 0.08, dur: 0.05, freq: midi(n + 12), gain: 0.04, decay: 0.6, osc: bell, send: 0.7 });
}

// ---- Reverb (Schroeder: 4 combs + 2 allpasses per side) ----
function reverb(input, offset) {
  const out = new Float32Array(N);
  for (const [d, g] of [[1557, 0.8], [1617, 0.79], [1491, 0.78], [1422, 0.77]]) {
    const buf = new Float32Array(d + offset);
    let idx = 0;
    let lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[idx];
      lp = y * 0.6 + lp * 0.4; // damping
      buf[idx] = input[i] + lp * g;
      out[i] += y * 0.25;
      idx = (idx + 1) % buf.length;
    }
  }
  for (const d of [556, 441]) {
    const buf = new Float32Array(d + offset);
    let idx = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[idx];
      const y = -out[i] + b;
      buf[idx] = out[i] + b * 0.5;
      out[i] = y;
      idx = (idx + 1) % buf.length;
    }
  }
  return out;
}
const wetL = reverb(sendL, 0);
const wetR = reverb(sendR, 23);

// ---- Master: mix, fade in/out, gentle saturation, normalize ----
const outL = new Float32Array(N);
const outR = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.6) * Math.min(1, (LENGTH - t) / 1.8);
  outL[i] = Math.tanh((L[i] + wetL[i] * 0.35) * 1.4) * fade;
  outR[i] = Math.tanh((R[i] + wetR[i] * 0.35) * 1.4) * fade;
  peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
}
const norm = 0.89 / peak;

const data = Buffer.alloc(44 + N * 4);
data.write("RIFF", 0);
data.writeUInt32LE(36 + N * 4, 4);
data.write("WAVEfmt ", 8);
data.writeUInt32LE(16, 16);
data.writeUInt16LE(1, 20);
data.writeUInt16LE(2, 22);
data.writeUInt32LE(SR, 24);
data.writeUInt32LE(SR * 4, 28);
data.writeUInt16LE(4, 32);
data.writeUInt16LE(16, 34);
data.write("data", 36);
data.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outL[i] * norm)) * 32767), 44 + i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outR[i] * norm)) * 32767), 46 + i * 4);
}
writeFileSync(process.argv[2] ?? "public/music.wav", data);
console.log(`wrote ${(N / SR).toFixed(1)} s, peak ${peak.toFixed(2)} → normalized`);
