// Pure easing/interpolation math backing the slippage counter's digit-roll
// animation (docs/DESIGN.md juice plan: "digits roll, not snap").

export function easeOutCubic(t) {
  const clamped = Math.min(Math.max(Number.isFinite(t) ? t : 0, 0), 1);
  return 1 - (1 - clamped) ** 3;
}

/** Interpolates from `from` to `to` at progress `t` (0..1), eased out. */
export function tweenValue(from, to, t) {
  const start = Number.isFinite(from) ? from : 0;
  const end = Number.isFinite(to) ? to : start;
  return start + (end - start) * easeOutCubic(t);
}
