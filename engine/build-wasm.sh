#!/usr/bin/env bash
# Builds the matching engine to wasm32-unknown-unknown and regenerates the
# wasm-bindgen JS bindings vendored into site/vendor/engine.
#
# Requires: rustup target add wasm32-unknown-unknown, and
# wasm-bindgen-cli installed at the exact version matching the
# wasm-bindgen crate dependency in Cargo.toml (see that file's comment).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../site/vendor/engine"

cd "$SCRIPT_DIR"
cargo build --release --target wasm32-unknown-unknown

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
wasm-bindgen --target web --out-dir "$OUT_DIR" \
  target/wasm32-unknown-unknown/release/order_flow_engine.wasm

echo "Vendored wasm bindings into $OUT_DIR"
