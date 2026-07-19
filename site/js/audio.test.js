import { describe, expect, it } from "vitest";
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
