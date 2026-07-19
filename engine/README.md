# order-flow-engine

The matching engine: walks a resting order-book snapshot level by level to fill a
market order, the same way a real exchange matching engine does. Pure Rust logic with
a `wasm-bindgen` entry point (`simulate_market_order_js`) so the site can call it
directly from JS after compiling to `wasm32-unknown-unknown`.

## Build

```sh
# native tests
cargo test

# wasm target (what the site consumes)
cargo build --release --target wasm32-unknown-unknown
```

See [`../docs/VISION.md`](../docs/VISION.md) for why the engine exists and
[`src/lib.rs`](src/lib.rs) for the fill algorithm and its unit tests.
