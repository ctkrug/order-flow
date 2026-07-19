import { describe, expect, it } from "vitest";
import { buildLadderRows, crossesWowThreshold } from "./ladder-model.js";

const asks = [
  { price: 100, size: 2 },
  { price: 101, size: 3 },
  { price: 102, size: 5 },
];

describe("buildLadderRows", () => {
  it("marks nothing consumed for an empty fill", () => {
    const rows = buildLadderRows(asks, []);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => !r.consumed)).toBe(true);
    expect(rows[0].remaining).toBe(2);
  });

  it("marks a level fully consumed when taken equals size", () => {
    const rows = buildLadderRows(asks, [{ price: 100, size_taken: 2 }]);
    expect(rows[0].consumed).toBe(true);
    expect(rows[0].fullyConsumed).toBe(true);
    expect(rows[0].remaining).toBe(0);
  });

  it("marks a level partially consumed", () => {
    const rows = buildLadderRows(asks, [{ price: 101, size_taken: 1.5 }]);
    expect(rows[1].consumed).toBe(true);
    expect(rows[1].fullyConsumed).toBe(false);
    expect(rows[1].remaining).toBe(1.5);
  });

  it("clamps taken to the level size even if the fill over-reports", () => {
    const rows = buildLadderRows(asks, [{ price: 100, size_taken: 999 }]);
    expect(rows[0].taken).toBe(2);
    expect(rows[0].remaining).toBe(0);
  });

  it("handles an empty book", () => {
    expect(buildLadderRows([], [])).toEqual([]);
  });

  it("handles undefined consumed levels", () => {
    const rows = buildLadderRows(asks, undefined);
    expect(rows.every((r) => !r.consumed)).toBe(true);
  });
});

describe("crossesWowThreshold", () => {
  it("is true going from zero to positive", () => {
    expect(crossesWowThreshold(0, 4.2)).toBe(true);
  });

  it("is false staying at zero", () => {
    expect(crossesWowThreshold(0, 0)).toBe(false);
  });

  it("is false once already past zero", () => {
    expect(crossesWowThreshold(3.1, 4.2)).toBe(false);
  });

  it("is false going from positive back to zero", () => {
    expect(crossesWowThreshold(4.2, 0)).toBe(false);
  });

  it("treats non-finite inputs as zero", () => {
    expect(crossesWowThreshold(NaN, 5)).toBe(true);
    expect(crossesWowThreshold(0, NaN)).toBe(false);
  });
});
