import * as d3 from "d3";

// Scaffold entry point. Confirms D3 is wired up; the WASM matching engine
// and the order-book visualization are built out in the BUILD phase
// following docs/DESIGN.md.
const status = d3.select("#status");
status.text("D3 loaded — order-book visualization coming next.");
