import { describe, expect, it } from "vitest";
import {
  clampTimelineIndex,
  formatSnapshotTime,
  isAtTimelineEnd,
  stepTimelineIndex,
} from "./timeline.js";

describe("clampTimelineIndex", () => {
  it("passes through an in-range index", () => {
    expect(clampTimelineIndex(2, 6)).toBe(2);
  });

  it("clamps a negative index to zero", () => {
    expect(clampTimelineIndex(-3, 6)).toBe(0);
  });

  it("clamps an out-of-range index to the last item", () => {
    expect(clampTimelineIndex(99, 6)).toBe(5);
  });

  it("returns 0 for an empty list", () => {
    expect(clampTimelineIndex(2, 0)).toBe(0);
  });

  it("truncates a fractional index", () => {
    expect(clampTimelineIndex(2.9, 6)).toBe(2);
  });

  it("uses the last whole index when a stale length is fractional", () => {
    expect(clampTimelineIndex(99, 2.9)).toBe(1);
  });
});

describe("stepTimelineIndex", () => {
  it("steps forward within range", () => {
    expect(stepTimelineIndex(1, 1, 6)).toBe(2);
  });

  it("does not overshoot past the last index", () => {
    expect(stepTimelineIndex(5, 1, 6)).toBe(5);
  });

  it("does not undershoot past zero", () => {
    expect(stepTimelineIndex(0, -1, 6)).toBe(0);
  });
});

describe("isAtTimelineEnd", () => {
  it("is false before the last snapshot", () => {
    expect(isAtTimelineEnd(2, 6)).toBe(false);
  });

  it("is true at the last snapshot", () => {
    expect(isAtTimelineEnd(5, 6)).toBe(true);
  });

  it("is false for an empty list", () => {
    expect(isAtTimelineEnd(0, 0)).toBe(false);
  });
});

describe("formatSnapshotTime", () => {
  it("formats a valid ISO timestamp", () => {
    expect(formatSnapshotTime("2026-07-19T14:26:41+00:00")).toBe("14:26:41 UTC");
  });

  it("falls back to an em dash for an invalid timestamp", () => {
    expect(formatSnapshotTime("not-a-date")).toBe("Invalid time");
  });

  it("falls back to an em dash for undefined", () => {
    expect(formatSnapshotTime(undefined)).toBe("Invalid time");
  });
});
