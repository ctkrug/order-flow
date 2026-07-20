# I built a browser lab for watching slippage form

Slippage is usually introduced with one sentence: a market order may fill at a
worse average price than the quote because the best level does not contain
enough size. I understood the sentence, but I wanted the explanation to behave
like the market. The price ladder should change as an order consumes it, and the
cost should appear at the same moment.

That became [Depthwalk](https://apps.charliekrug.com/order-flow/), a small browser
lab built around historical Coinbase L2 snapshots. You choose a deep BTC-USD
book or a thinner AUCTION-USD book, scrub one of six timestamps, pick a side,
and drag an order-size slider. Amber bars mark the depth consumed at each price.
Best price, average fill price, unfilled size, and dollar slippage update with
the drag.

## Keeping the math outside the animation

The matching code is a Rust function that accepts price levels already sorted
best to worst. It walks each level, takes the smaller of the remaining order and
the resting size, accumulates notional, and stops when the order is filled or
the book is empty. The buy-side slippage calculation is:

```text
(average fill price - best ask) * filled size
```

The sell side mirrors it against the best bid. Rust unit tests cover top-level
fills, multi-level fills, exhausted depth, malformed levels, and extremely large
orders. The same function is exposed through `wasm-bindgen`, so the browser is
not running a second JavaScript approximation of the algorithm.

I deliberately kept the generated WASM bindings out of git. Vite's development
and build hooks call a short shell script that compiles the Rust target and runs
the matching `wasm-bindgen-cli` version. That adds a local toolchain requirement,
but it prevents checked-in bindings from drifting away from the Rust source.

## Letting D3 own the stateful part

The Rust result is plain structured data: consumed levels, filled and unfilled
size, average price, best price, and slippage cost. D3 joins those levels to
ladder rows. Each row draws separate remaining and consumed bars, which makes a
partial fill visible instead of reducing the interaction to a final number.

The view remembers the prices consumed on the previous render. A newly crossed
level gets a short flash and a synthesized WebAudio tick. The slippage number
uses a 120 ms eased interpolation, and its first move above zero triggers a
small amber pulse. Reduced-motion preferences disable the atmospheric sweep and
pulse without changing the calculations.

One replay detail was easy to miss: each snapshot contains a different amount
of depth. Keeping a fixed slider maximum made the same thumb position mean
something different after a timeline move. Depthwalk now recalculates the range
for each snapshot while preserving the slider's relative position. A Firefox
test locks that behavior down.

## What I would change next

The bundled data is intentionally small: two products, six snapshots each, and
the top fifteen levels per side. That makes the project static and quick to load,
but it limits the comparisons you can run. A next version could accept a local
snapshot file, validate its schema in a Web Worker, and keep every byte on the
visitor's machine. I would also add a percentage-of-visible-depth mode so two
products with very different base-asset sizes are easier to compare.

For now, the narrow scope keeps the interaction honest. It does one job: connect
the order path to the cost that path creates.

Try Depthwalk: [apps.charliekrug.com/order-flow](https://apps.charliekrug.com/order-flow/)

Read the source: [github.com/ctkrug/order-flow](https://github.com/ctkrug/order-flow)
