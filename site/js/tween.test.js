import { describe, expect, it } from "vitest";
import { easeOutCubic, tweenValue } from "./tween.js";

describe("easeOutCubic", () => {
  it("starts at 0", () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it("ends at 1", () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it("front-loads progress (past the linear midpoint by t=0.5)", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it("clamps t below 0", () => {
    expect(easeOutCubic(-1)).toBe(0);
  });

  it("clamps t above 1", () => {
    expect(easeOutCubic(2)).toBe(1);
  });
});

describe("tweenValue", () => {
  it("returns the start value at t=0", () => {
    expect(tweenValue(10, 20, 0)).toBe(10);
  });

  it("returns the end value at t=1", () => {
    expect(tweenValue(10, 20, 1)).toBe(20);
  });

  it("interpolates between the two values for 0<t<1", () => {
    const mid = tweenValue(0, 10, 0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(10);
  });

  it("handles a decreasing value", () => {
    expect(tweenValue(20, 10, 1)).toBe(10);
  });

  it("handles from === to", () => {
    expect(tweenValue(5, 5, 0.5)).toBe(5);
  });
});
