// Pure display-formatting helpers. Kept free of DOM/wasm dependencies so
// they're trivial to unit test in isolation from rendering concerns.

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a dollar amount, e.g. slippage cost or fill price, as USD.
 * Non-finite input (NaN, Infinity, undefined) renders as $0.00 rather
 * than leaking a broken string into the HUD.
 */
export function formatUsd(value) {
  return usdFormatter.format(Number.isFinite(value) ? value : 0);
}

/**
 * Formats an order/fill size with enough precision for thin sub-1.0
 * quantities without dragging trailing zeros on round numbers.
 */
export function formatSize(value, maxDecimals = 6) {
  if (!Number.isFinite(value)) return "0";
  const decimals = Number.isInteger(maxDecimals) && maxDecimals >= 0 && maxDecimals <= 100
    ? maxDecimals
    : 6;
  const clamped = Math.max(value, 0);
  return Number(clamped.toFixed(decimals)).toString();
}
