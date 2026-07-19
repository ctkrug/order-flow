import { afterEach, describe, expect, it, vi } from "vitest";
import { createAudio } from "./audio.js";

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

class FakeAudioContext {
  static instances = [];

  constructor() {
    this.currentTime = 10;
    this.sampleRate = 8000;
    this.destination = {};
    this.oscillators = [];
    this.buffers = [];
    FakeAudioContext.instances.push(this);
  }

  createOscillator() {
    const oscillator = {
      frequency: { value: 0 },
      connect: vi.fn((target) => target),
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn((target) => target),
    };
  }

  createBuffer(_channels, frames) {
    const data = new Float32Array(frames);
    const buffer = { getChannelData: vi.fn(() => data) };
    this.buffers.push(buffer);
    return buffer;
  }

  createBufferSource() {
    return { connect: vi.fn((target) => target), start: vi.fn(), buffer: null };
  }

  createBiquadFilter() {
    return { connect: vi.fn((target) => target), frequency: { value: 0 }, type: "" };
  }
}

afterEach(() => {
  FakeAudioContext.instances = [];
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("createAudio mute state", () => {
  it("defaults to unmuted with no stored preference", () => {
    const audio = createAudio(fakeStorage());
    expect(audio.isMuted()).toBe(false);
  });

  it("reads a previously stored muted=true preference", () => {
    const audio = createAudio(fakeStorage({ "order-flow-muted": "true" }));
    expect(audio.isMuted()).toBe(true);
  });

  it("persists setMuted through the storage", () => {
    const storage = fakeStorage();
    const audio = createAudio(storage);
    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
    expect(storage.getItem("order-flow-muted")).toBe("true");
  });

  it("does not throw if storage.getItem throws (e.g. disabled storage)", () => {
    const throwing = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("storage disabled");
      },
    };
    expect(() => createAudio(throwing)).not.toThrow();
    const audio = createAudio(throwing);
    expect(() => audio.setMuted(true)).not.toThrow();
  });

  it("works with no storage argument at all", () => {
    expect(() => createAudio(undefined)).not.toThrow();
  });
});

describe("createAudio SFX in an environment without WebAudio", () => {
  it("no-ops instead of throwing when AudioContext is unavailable", () => {
    const audio = createAudio(fakeStorage());
    expect(() => audio.levelTick(0)).not.toThrow();
    expect(() => audio.counterClick()).not.toThrow();
    expect(() => audio.wowMoment()).not.toThrow();
    expect(() => audio.scrubWhoosh()).not.toThrow();
  });

  it("still no-ops when muted is explicitly set", () => {
    const audio = createAudio(fakeStorage());
    audio.setMuted(true);
    expect(() => audio.levelTick(3)).not.toThrow();
  });
});

describe("createAudio SFX with WebAudio", () => {
  it("creates and throttles a level tick oscillator", () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const audio = createAudio(fakeStorage());

    audio.levelTick(4);
    audio.levelTick(5);

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].oscillators).toHaveLength(1);
    expect(FakeAudioContext.instances[0].oscillators[0].frequency.value).toBe(188);
    expect(FakeAudioContext.instances[0].oscillators[0].start).toHaveBeenCalledOnce();
  });

  it("synthesizes noise for counter and scrub feedback", () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const audio = createAudio(fakeStorage());

    audio.counterClick();
    audio.scrubWhoosh();

    expect(FakeAudioContext.instances[0].buffers).toHaveLength(2);
    expect(FakeAudioContext.instances[0].buffers[0].getChannelData).toHaveBeenCalledOnce();
  });

  it("plays the delayed second note of the wow chime", () => {
    vi.useFakeTimers();
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const audio = createAudio(fakeStorage());

    audio.wowMoment();
    vi.advanceTimersByTime(90);

    expect(FakeAudioContext.instances[0].oscillators).toHaveLength(2);
    expect(FakeAudioContext.instances[0].oscillators[1].frequency.value).toBe(660);
  });
});
