"use client";

const storageKey = "campusnav:sound";
const soundEvents = new EventTarget();
let context: AudioContext | undefined;
let output: GainNode | undefined;
let enabled = true;

type Note = [frequency: number, duration: number, offset?: number];
const cues = {
  next: [[360, .1], [590, .12, .045]],
  back: [[560, .09], [345, .1, .035]],
  step: [[480, .08]],
  map: [[300, .11], [450, .13, .055], [660, .14, .11]],
  close: [[315, .13], [225, .12, .05]],
  reject: [[265, .13], [195, .14, .06]],
  accept: [[480, .1], [720, .15, .06]],
  finish: [[390, .12], [520, .12, .07], [780, .2, .14]],
} satisfies Record<string, Note[]>;

export function soundEnabled() {
  try { return localStorage.getItem(storageKey) !== "off"; } catch { return enabled; }
}

export function subscribeSound(listener: () => void) {
  soundEvents.addEventListener("change", listener);
  window.addEventListener("storage", listener);
  return () => {
    soundEvents.removeEventListener("change", listener);
    window.removeEventListener("storage", listener);
  };
}

export function setDeckSound(value: boolean) {
  enabled = value;
  try { localStorage.setItem(storageKey, value ? "on" : "off"); } catch { /* Use the current tab preference. */ }
  if (context && output) output.gain.setTargetAtTime(value ? .15 : 0, context.currentTime, .015);
  soundEvents.dispatchEvent(new Event("change"));
  if (value) {
    primeDeckSound();
    playDeckSound("accept");
  }
}

export function primeDeckSound() {
  if (!soundEnabled() || !window.AudioContext) return;
  try {
    if (!context) {
      context = new AudioContext();
      output = context.createGain();
      output.gain.value = .15;
      output.connect(context.destination);
    }
    if (context.state === "suspended") void context.resume().catch(() => {});
  } catch { /* The deck remains usable when audio is unavailable. */ }
}

export function playDeckSound(cue: keyof typeof cues) {
  if (!soundEnabled() || !context || !output) return;
  const audio = context;
  const bus = output;
  bus.gain.setTargetAtTime(.15, audio.currentTime, .015);
  const time = audio.currentTime + .012;
  for (const [frequency, duration, offset = 0] of cues[cue] as Note[]) {
    const start = time + offset;
    const voice = audio.createOscillator();
    const envelope = audio.createGain();
    voice.type = "sine";
    voice.frequency.value = frequency;
    envelope.gain.setValueAtTime(.001, start);
    envelope.gain.exponentialRampToValueAtTime(.6, start + .012);
    envelope.gain.exponentialRampToValueAtTime(.001, start + duration);
    voice.connect(envelope).connect(bus);
    voice.start(start);
    voice.stop(start + duration);
    voice.onended = () => { voice.disconnect(); envelope.disconnect(); };
  }
}
