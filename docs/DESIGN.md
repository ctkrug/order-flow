# Design

## 1. Aesthetic direction

**Depthwalk is blueprint/technical**: the page reads like an annotated engineering
schematic of the order book, with a deep blueprint-navy ground, cyan linework, precise tick
marks, monospace data readouts, and a faint sweeping scan-line that ties back to "watch
the mechanics happen." It's built to make the *mechanism* legible, the way a schematic
makes a circuit legible, rather than dressing the data up as a generic fintech dashboard.
This is deliberately not "dark gray cards + one blue accent." The blueprint grid, the
schematic callouts, and the monospace data voice are the personality, not just a color
choice.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0d1b2a` | page ground (deep blueprint navy) |
| `--surface-1` | `#13263b` | panels (order book ladder, controls) |
| `--surface-2` | `#1b3350` | raised/active panels, hover fill |
| `--text` | `#e8f1f8` | primary text |
| `--text-muted` | `#7d93a8` | secondary labels, axis ticks |
| `--accent-buy` | `#3ddc97` | bid side, buy actions, positive fills |
| `--accent-sell` | `#ff6b6b` | ask side, sell actions |
| `--accent-slippage` | `#ffb84d` | slippage highlight, the "cost" readout |
| `--success` | `#3ddc97` | shared with accent-buy |
| `--danger` | `#ff6b6b` | shared with accent-sell |
| `--line` | `#2a4460` | blueprint grid lines, dashed guides |

**Type pairing:** display/wordmark: **Space Grotesk** (Google Fonts), a geometric
sans with a technical edge, for the wordmark and headings. Data/UI: **JetBrains Mono**
(Google Fonts) for every number, price, label, and control. Order-book prices and the
slippage counter must feel like real instrument readouts, monospaced so digits don't
jitter the layout as they change. System fallback stack for both: `ui-sans-serif,
system-ui` / `ui-monospace, "SF Mono", monospace`.

**Spacing:** 8px base unit (8/16/24/32/48/64).

**Corner radius:** 2px on panels and controls: sharp, drafting-table precision, not
soft app-UI rounding. Buttons and the slider thumb get 3px.

**Shadow / glow:** no drop shadows; depth comes from a 1px `--line` border plus a soft
`box-shadow: 0 0 16px rgba(61, 220, 151, 0.15)` cyan-green glow on active/focused
elements, as if the schematic trace is energized.

**Motion:** UI transitions 160ms ease-out. Level-consumption feedback (the fast stuff
happening as the slider moves) is snappier: 90ms ease-out flash per level.

## 3. Layout intent

**The hero is the order-book ladder + the size slider directly beneath it.** Together
they own ~65% of the viewport on desktop. Above them, a slim header with the wordmark
and mute toggle. To the side (desktop) / below (phone), a HUD-style stats readout: best
price, average fill price, and the big **slippage-cost counter** in `--accent-slippage`,
styled like a schematic callout box with a leader line to the ladder.

- **1440×900 desktop:** header (64px) → two-column body: order-book ladder + slider
  (left, ~65% width) and the stats HUD (right, ~35% width) → a scrubbable snapshot
  timeline strip along the bottom (72px). No dead margins: the ladder panel fills its
  column's height.
- **390×844 phone:** header → order-book ladder (full width, ~50vh) → size slider
  (full width, large touch target) → stats HUD (full width, below) → timeline strip
  (horizontally scrollable if needed). Everything stacks in priority order: see the
  book, size the order, read the cost.

## 4. Signature detail

A faint **blueprint grid** (1px `--line` lines, 24px pitch) sits behind everything, and
a slow **scan-line sweep** (a soft cyan gradient band, ~4s loop, opacity ~0.05) drifts
top-to-bottom across the whole page. It stays subtle and pauses under
`prefers-reduced-motion`. The wordmark "DEPTHWALK" ends with a blinking
monospace cursor block (like a ticker prompt), animated with a CSS step function.

## 5. The juice plan

This is a toy, not a game, but every interaction still needs to feel alive:

- **Slider drag:** order size readout updates continuously (no debounce); the ladder
  re-renders the consumed levels live as the thumb moves, each newly-consumed level
  getting a 90ms flash from `--surface-2` to `--accent-buy`/`--accent-sell` before
  settling to a filled state.
- **Level consumed:** a brief (90ms) flash + a 1px outward pulse on that row.
- **Slippage counter:** digits roll (not snap) when the value changes, via a short
  tween (120ms) on the displayed number.
- **Order fully sized / "wow" moment reached:** when the slider first pushes the order
  past the top-of-book level (i.e., the first time slippage becomes nonzero), the
  slippage HUD box gets a one-time amber glow pulse to mark the moment it "clicked."
- **Timeline scrub:** dragging the snapshot timeline crossfades the ladder (140ms)
  rather than hard-cutting, so replay feels continuous.

**Synth SFX (WebAudio, oscillator/noise-generated, no audio files):**
- `level-tick`: short square-wave blip, pitch stepping down slightly per level
  consumed, ~30ms, low volume (fires per level as the slider crosses it).
- `counter-click`: a very short (~15ms) filtered noise tick under the rolling
  slippage counter, rate-throttled so rapid drags don't machine-gun.
- `wow-moment`: a brief rising two-note chime the first time slippage goes nonzero.
- `scrub-whoosh`: a soft, short filtered-noise sweep on timeline scrub release.

All sounds are subtle and rate-throttled. A mute toggle (top-right, icon button) lives
in the header, persists to `localStorage`, and the `AudioContext` is created lazily on
first user gesture, guarded for environments without WebAudio.
