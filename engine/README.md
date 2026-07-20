# Depthwalk matching engine

The matching engine: walks a resting order-book snapshot level by level to fill a
market order, the same way a real exchange matching engine does. Pure Rust logic with
a `wasm-bindgen` entry point (`simulate_market_order_js`) so the site can call it
directly from JS after compiling to `wasm32-unknown-unknown`.

## Build

```sh
# native tests
cargo test

# wasm target + regenerate the JS bindings the site imports
./build-wasm.sh
```

`build-wasm.sh` builds the `wasm32-unknown-unknown` target and runs
`wasm-bindgen` (must match the crate's pinned version in `Cargo.toml`
exactly) into `../site/vendor/engine`, gitignored and regenerated
automatically by the site's `npm run dev`/`build`.

See [`../docs/VISION.md`](../docs/VISION.md) for why the engine exists and
[`src/lib.rs`](src/lib.rs) for the fill algorithm and its unit tests.
