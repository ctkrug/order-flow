// WebAudio-synthesized SFX per docs/DESIGN.md's juice plan — oscillators
// and generated noise only, zero audio file assets. The AudioContext is
// created lazily on first playback (itself only ever called from inside a
// user-gesture event handler), and every entry point no-ops quietly in
// environments without WebAudio (e.g. the vitest/node test environment).

const MUTE_STORAGE_KEY = "order-flow-muted";
const LEVEL_TICK_THROTTLE_MS = 20;
const COUNTER_CLICK_THROTTLE_MS = 60;

export function createAudio(storage = globalThis.localStorage) {
  let ctx = null;
  let muted = readStoredMuted(storage);
  let lastLevelTickAt = -Infinity;
  let lastCounterClickAt = -Infinity;

  function readStoredMuted(store) {
    try {
      return store?.getItem(MUTE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }

  function ensureContext() {
    if (ctx) return ctx;
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  }

  function playTone(freq, durationMs, gainValue = 0.05, type = "square") {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain).connect(c.destination);
    const now = c.currentTime;
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  }

  function playNoise(durationMs, gainValue, filterFreq) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const frameCount = Math.max(1, Math.floor((c.sampleRate * durationMs) / 1000));
    const buffer = c.createBuffer(1, frameCount, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) data[i] = Math.random() * 2 - 1;

    const source = c.createBufferSource();
    source.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = c.createGain();
    gain.gain.value = gainValue;
    source.connect(filter).connect(gain).connect(c.destination);
    source.start();
  }

  return {
    isMuted() {
      return muted;
    },
    setMuted(value) {
      muted = value;
      try {
        storage?.setItem(MUTE_STORAGE_KEY, String(muted));
      } catch {
        // storage unavailable (private browsing, disabled) — mute state
        // just won't persist across reloads, which is a harmless fallback.
      }
    },
    /** Short pitch-stepping blip fired as each level is consumed. */
    levelTick(levelsConsumedSoFar = 0) {
      const now = performance.now();
      if (now - lastLevelTickAt < LEVEL_TICK_THROTTLE_MS) return;
      lastLevelTickAt = now;
      const freq = Math.max(220 - levelsConsumedSoFar * 8, 80);
      playTone(freq, 30, 0.04, "square");
    },
    /** Rate-throttled tick under the rolling slippage counter. */
    counterClick() {
      const now = performance.now();
      if (now - lastCounterClickAt < COUNTER_CLICK_THROTTLE_MS) return;
      lastCounterClickAt = now;
      playNoise(15, 0.03, 3000);
    },
    /** Rising two-note chime the first time slippage goes nonzero. */
    wowMoment() {
      playTone(440, 90, 0.06, "sine");
      setTimeout(() => playTone(660, 110, 0.06, "sine"), 90);
    },
    /** Soft filtered-noise sweep on timeline scrub release. */
    scrubWhoosh() {
      playNoise(140, 0.035, 1200);
    },
  };
}
