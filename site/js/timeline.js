// Pure index/time math for the scrubbable snapshot timeline.

/** Clamps an index into the valid [0, length-1] range for a snapshot list. */
export function clampTimelineIndex(index, length) {
  if (!Number.isFinite(length) || length <= 0) return 0;
  const count = Math.trunc(length);
  if (count <= 0) return 0;
  const truncated = Math.trunc(Number.isFinite(index) ? index : 0);
  return Math.min(Math.max(truncated, 0), count - 1);
}

/** Advances the timeline by `delta` steps, clamping at both ends (no wrap). */
export function stepTimelineIndex(index, delta, length) {
  return clampTimelineIndex((Number.isFinite(index) ? index : 0) + delta, length);
}

/** True once playback has reached the last snapshot. */
export function isAtTimelineEnd(index, length) {
  return length > 0 && clampTimelineIndex(index, length) >= length - 1;
}

/** Formats a snapshot's ISO timestamp for the timeline readout, e.g. "14:26:41 UTC". */
export function formatSnapshotTime(isoString) {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return "Invalid time";
  return `${parsed.toISOString().slice(11, 19)} UTC`;
}
