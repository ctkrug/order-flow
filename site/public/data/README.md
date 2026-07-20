# Bundled order-book snapshot data

Two real L2 order-book snapshot sequences, captured live from Coinbase
Exchange's public REST API (`GET /products/{product}/book?level=2`, no
authentication required). The values are not synthetic or randomly generated.

- `snapshots-calm.json`: **BTC-USD**, a deep and liquid book. A market
  order needs real size before it visibly eats through more than the
  top level.
- `snapshots-thin.json`: **AUCTION-USD**, a thin, low-liquidity book.
  Depth falls off sharply after the first level or two, so a modest
  order produces noticeable slippage.

Each file holds 6 snapshots taken ~4 seconds apart (top 15 price levels
per side), forming a short scrubbable timeline per scenario. Each
snapshot has the shape:

```json
{ "t": "2026-07-19T14:26:41+00:00", "bids": [[price, size], ...], "asks": [[price, size], ...] }
```

`bids` are sorted best-to-worst (highest price first); `asks` are
sorted best-to-worst (lowest price first), which is the order the matching
engine expects for a sell or buy market order respectively.

To recapture a fresh sequence, re-run the fetch against the same
public endpoint for the products above.
