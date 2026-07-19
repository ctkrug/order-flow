// Pure mapping from raw book levels + a fill result's consumed levels into
// the per-row render state the D3 ladder view draws. Kept separate from
// book-view.js so the "which rows are consumed, by how much" logic is
// unit-testable without a DOM.

/**
 * @param {Array<{price: number, size: number}>} levels sorted best-to-worst
 * @param {Array<{price: number, size_taken: number}>} consumedLevels from a FillResult
 * @returns {Array<{price: number, size: number, taken: number, remaining: number, consumed: boolean, fullyConsumed: boolean}>}
 */
export function buildLadderRows(levels, consumedLevels) {
  const takenByPrice = new Map();
  for (const c of Array.isArray(consumedLevels) ? consumedLevels : []) {
    if (!Number.isFinite(c?.price) || !Number.isFinite(c?.size_taken) || c.size_taken <= 0) {
      continue;
    }
    takenByPrice.set(c.price, (takenByPrice.get(c.price) ?? 0) + c.size_taken);
  }

  return (Array.isArray(levels) ? levels : []).map((level) => {
    const size = Number.isFinite(level?.size) && level.size > 0 ? level.size : 0;
    const taken = Math.min(takenByPrice.get(level?.price) ?? 0, size);
    return {
      price: level?.price,
      size,
      taken,
      remaining: Math.max(size - taken, 0),
      consumed: taken > 0,
      fullyConsumed: taken >= size && size > 0,
    };
  });
}

/**
 * True exactly on the transition from zero to nonzero slippage — the
 * moment the docs/DESIGN.md juice plan calls the "wow moment" pulse.
 */
export function crossesWowThreshold(previousSlippageCost, currentSlippageCost) {
  const prev = Number.isFinite(previousSlippageCost) ? previousSlippageCost : 0;
  const current = Number.isFinite(currentSlippageCost) ? currentSlippageCost : 0;
  return prev <= 0 && current > 0;
}
