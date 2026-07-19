# Vision

## The problem

"Slippage" is one of those market-microstructure concepts everyone nods along to and
almost nobody has actually *seen*. The standard explanation is a sentence and maybe a
static table: a market order for size N fills across several price levels because the
top of the book doesn't have enough depth, so your average price is worse than the
quote you saw. That's correct and it teaches nothing — there's no moment where the
idea clicks.

The tools that would let you see it for real — a professional trading terminal, or raw
tick-level research data in a Jupyter notebook — are built for practitioners, not for
someone trying to build an intuition for the first time. They require a login, a data
subscription, or the ability to write pandas code before you even get to the "aha."

## Who it's for

Anyone building an intuition for market microstructure without a trading desk: students
in a finance or CS course, new retail traders who've heard "watch out for slippage on
thin books" but never seen it happen, and engineers building trading-adjacent tools who
want a gut feel for order-book mechanics before they touch a real matching engine.
No account, no data subscription, no notebook — open a URL.

## The core idea

Replay **real historical L2 order-book snapshots** and simulate a market order eating
through them, using an actual matching-engine algorithm (not a canned animation) running
**client-side in the browser**. The user controls two things: *when* (scrub a timeline
of snapshots) and *how big* (drag a slider to size a market buy or sell). The engine
walks the book level by level exactly as a real exchange would, and the visualization
shows it happening — levels highlighting as they're consumed, a running dollar-slippage
counter climbing as the order digs into worse and worse prices.

The wow moment is the whole point: drag the size slider up, watch the order visibly eat
through three, four, five price levels, and watch "you just paid $X in slippage" tick
upward in real time. That single interaction has to work well before anything else gets
built.

## Key design decisions

- **A real matching engine, not an animation.** The Rust/WASM engine implements the
  actual price-time-priority fill algorithm. This is what makes the demo credible
  instead of decorative — the numbers it produces are the numbers a real exchange would
  produce against that book.
- **Client-side only.** No backend, no signup, nothing to install. The engine compiles
  to WASM and runs in the visitor's browser; historical snapshots ship as static data
  bundled with the site. This keeps the tool a zero-friction teaching aid rather than a
  service someone has to trust with an account.
- **Replay, not live data.** Live order-book feeds require infrastructure, API keys, and
  uptime commitments that don't serve the teaching goal. A curated set of real historical
  snapshots — including at least one calm, deep book and one thin, volatile book — lets
  the user compare *why* slippage differs without needing a live connection.
- **D3 owns the visualization, Rust owns the math.** The matching engine never touches
  the DOM; it returns structured fill results (consumed levels, average price, slippage
  cost) that D3 renders. This keeps the simulation testable in isolation (see
  `engine/src/lib.rs` unit tests) independent of any rendering concerns.

## What "v1 done" looks like

- A visitor can land on the page with zero setup and, within seconds, drag a size
  slider and watch a market order consume real order-book levels with a live slippage
  counter — the wow moment from the top of this doc, working end to end.
- At least one real historical order-book scenario is bundled and replayable, with a
  scrubbable timeline of snapshots.
- The order-book depth visualization clearly shows which levels were consumed and at
  what price, not just a final number.
- The matching engine's fill logic is unit-tested and runs identically whether called
  from Rust tests or from the WASM build the site uses.
- The page is a single static, self-contained site: no backend, deployable to any
  static host or subpath, and it looks and feels intentionally designed end to end
  (see `docs/DESIGN.md`) — not a functional-but-bare prototype.
