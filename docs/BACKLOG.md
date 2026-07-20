# Backlog

Epics and stories for building Depthwalk to v1. All stories start unchecked. The
first story of Epic 1 is the core interaction, which lands before anything else.

## Epic 1: Core matching engine and the core interaction

- [x] **1.1 [WOW MOMENT] Drag a slider to size a market order and watch it eat the book**
  - Dragging the size slider updates the highlighted/consumed order-book levels live,
    no page reload, no submit button.
  - A "you just paid $X.XX in slippage" counter is visible and updates continuously as
    the slider moves, computed as `(avg_fill_price - best_price) * filled_size`.
  - Sizing the order within the top price level shows $0.00 slippage; sizing it past
    the top level produces a nonzero value that increases as the slider increases.

- [x] **1.2 Wire the WASM matching engine into the site**
  - `engine/` builds to `wasm32-unknown-unknown` and is loadable from `site/js` via the
    `wasm-bindgen`-generated module.
  - Calling the exported `simulate_market_order_js` from JS with a sample book returns
    the same fill result (levels, avg price, slippage cost) as the Rust unit tests for
    an equivalent input.

- [x] **1.3 Render the order-book ladder with D3**
  - Bid and ask price levels render as two ladders, bar length/area proportional to
    each level's size.
  - Consumed levels are visually distinguished (color/state) from untouched levels.

- [x] **1.4 Buy/sell side toggle**
  - A control switches the simulated order between buy (consumes asks) and sell
    (consumes bids).
  - Switching sides updates the ladder and slippage counter without a full page reload.

## Epic 2: Historical data and replay

- [x] **2.1 Bundle real historical order-book snapshot data**
  - At least one real (not synthetic/random) historical L2 snapshot sequence ships as
    static JSON under `site/data`, with its source documented in a README or code
    comment alongside it.
  - The bundle includes at least one calm/deep-book scenario and one thin/volatile
    scenario.

- [x] **2.2 Scrubbable snapshot timeline**
  - A timeline control lets the user scrub between snapshots in the bundled sequence.
  - Moving the scrubber updates the rendered order book to the selected snapshot's
    state with no perceptible lag (updates within one animation frame).

- [x] **2.3 Scenario selector**
  - The user can switch between bundled scenarios (calm vs. thin book) from a visible
    control.
  - Switching scenario resets the timeline position and order size to that scenario's
    defaults.

## Epic 3: Visual design and feel (per `docs/DESIGN.md`)

- [x] **3.1 Implement the blueprint/technical visual system**
  - Page uses the color, font (Space Grotesk + JetBrains Mono), spacing, and radius
    tokens defined in `docs/DESIGN.md`.
  - The blueprint grid background and scan-line sweep are present and pause under
    `prefers-reduced-motion`.

- [x] **3.2 Interaction states & juice**
  - The slider, buttons, and side toggle all have themed hover/focus-visible/active
    states, with no naked native widgets.
  - Level-consumed flash and slippage-counter digit-roll animations are implemented
    per the juice plan in `docs/DESIGN.md`.

- [x] **3.3 Synth sound effects with mute toggle**
  - WebAudio-synthesized SFX (`level-tick`, `counter-click`, `wow-moment`,
    `scrub-whoosh`) fire on their respective triggers, generated in code with zero
    audio file assets.
  - A mute toggle in the header silences all SFX, and its state persists across page
    reloads via `localStorage`.

- [x] **3.4 Responsive layout at phone / tablet / desktop**
  - Layout composes with no horizontal scroll or overlap at 390px, 768px, and 1440px
    widths.
  - Touch targets (slider thumb, toggle, buttons) are ≥44px on the phone layout.

- [x] **3.5 Design polish pass**
  - A full self-review against `docs/DESIGN.md` §D3 (resize/squint/tab-through/play)
    is performed and any gaps found are fixed before this story is checked off.
  - A generated favicon and the designed wordmark (Space Grotesk + blinking cursor)
    are implemented, with no default globe icon.

## Epic 4: Ship readiness

- [x] **4.1 Landing framing on the same page**
  - A brief above-the-fold intro (what this is, one-sentence pitch) appears before or
    alongside the interactive tool, using the same design tokens as the tool itself.
  - No placeholder or lorem-ipsum copy anywhere on the page.

- [x] **4.2 Static build output for subpath hosting**
  - `npm run build` in `site/` produces a single self-contained `dist/` directory
    using only relative asset paths (no build output references an absolute `/…`
    asset URL).
  - The built `dist/` works when served from a non-root subpath via a local static
    server with a path prefix.

- [x] **4.3 Cross-browser & error-state check**
  - The app shows a designed (not blank or console-only) error state if the WASM
    module fails to load.
  - A manual check in at least two browser engines (e.g. Chromium and Firefox)
    confirms the wow-moment interaction (story 1.1) works in both.
