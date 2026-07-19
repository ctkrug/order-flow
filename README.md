# Order Flow

Scrub back through **real historical order-book snapshots** and watch a market order
physically eat through price levels. Order Flow makes slippage visible instead of
abstract: drag a slider to size up a market buy, and watch it consume the book one
price level at a time while a running **"you just paid $X in slippage"** counter climbs.

No signup, no server round-trips, no professional trading terminal to learn — replay
a real book, scrub the timeline, size an order, and watch the mechanics of market
impact happen in front of you.

## Why

Slippage is usually explained with a paragraph and a static diagram: "a large market
order consumes multiple price levels, so your average fill price is worse than the
top-of-book quote." That's true and it's also unconvincing. Order Flow replaces the
paragraph with a simulation: a real matching engine, running against real historical
depth data, client-side, that you can rewind and replay. Watching an order eat through
five price levels and seeing the running cost tick upward teaches the concept in a way
prose never will.

The audience is anyone curious about market microstructure — students, new traders,
engineers building trading tools — who doesn't want to install a professional terminal
or read raw research code to understand what "market impact" actually looks like.

## How it works

- A **Rust matching engine, compiled to WebAssembly**, replays historical L2 order-book
  snapshots and simulates a market order walking the book exactly as a real exchange
  matching engine would: filling at each price level in order until the order size is
  exhausted.
- A **D3-rendered order-book visualization** shows bid/ask depth as it existed at the
  scrubbed point in time, with consumed levels highlighted as the simulated order eats
  through them.
- Everything runs **entirely client-side** — no backend, no signup, no API keys. Open
  the page and it works.

## Features

- [x] Scrub through a timeline of historical order-book snapshots
- [x] Drag a slider to size a market buy or sell order
- [x] Watch the order consume price levels in real time, level by level
- [x] Running "slippage paid" counter (vs. best-price execution)
- [x] Depth ladder that highlights exactly which levels were consumed
- [x] Multiple historical scenarios (calm book vs. thin/volatile book) to compare impact

## Stack

- **Matching engine:** Rust, compiled to WebAssembly (`wasm-bindgen`)
- **Rendering:** D3.js (order-book ladder + level visualization)
- **Build:** `wasm-bindgen-cli` regenerates the JS bindings (`engine/build-wasm.sh`),
  vendored into `site/vendor/engine` (gitignored, rebuilt by `npm run dev`/`build`);
  the site itself builds with Vite into a single static, subpath-relative `dist/`
- **Hosting:** static, self-contained — deployable to any static host or subpath

## Status

Core functionality is built end-to-end: the wow moment (drag-to-size-an-order with a
live slippage counter), both bundled scenarios, the scrubbable timeline, buy/sell
toggle, and synth SFX with a persisted mute toggle. See
[`docs/VISION.md`](docs/VISION.md) for the design and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the story-by-story build plan.

## License

MIT — see [`LICENSE`](LICENSE).
