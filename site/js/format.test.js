import { describe, expect, it } from "vitest";
import { formatSize, formatUsd } from "./format.js";

describe("formatUsd", () => {
  it("formats a typical positive amount", () => {
    expect(formatUsd(12.5)).toBe("$12.50");
  });

  it("formats zero", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });

  it("rounds to two decimal places", () => {
    expect(formatUsd(1234.567)).toBe("$1,234.57");
  });

  it("falls back to $0.00 for NaN", () => {
    expect(formatUsd(NaN)).toBe("$0.00");
  });

  it("falls back to $0.00 for Infinity", () => {
    expect(formatUsd(Infinity)).toBe("$0.00");
  });

  it("falls back to $0.00 for undefined", () => {
    expect(formatUsd(undefined)).toBe("$0.00");
  });
});

describe("formatSize", () => {
  it("formats a whole number without trailing zeros", () => {
    expect(formatSize(5)).toBe("5");
  });

  it("keeps precision for small fractional sizes", () => {
    expect(formatSize(0.01621543)).toBe("0.016215");
  });

  it("formats zero", () => {
    expect(formatSize(0)).toBe("0");
  });

  it("clamps negative input to zero", () => {
    expect(formatSize(-3)).toBe("0");
  });

  it("falls back to 0 for non-finite input", () => {
    expect(formatSize(NaN)).toBe("0");
    expect(formatSize(Infinity)).toBe("0");
  });

  it("respects a custom decimal count", () => {
    expect(formatSize(1.23456789, 2)).toBe("1.23");
  });
});
