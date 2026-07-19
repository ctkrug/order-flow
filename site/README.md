# order-flow-site

The D3 front end: renders the order-book ladder, the size slider, and the slippage
HUD, and calls into the WASM matching engine (`../engine`) to compute fills. Static,
self-contained, and built with relative asset paths so it can be hosted at any
subpath.

## Develop

```sh
npm install
npm run dev      # local dev server
npm run build    # outputs dist/ — single self-contained static site
```

Visual direction lives in [`../docs/DESIGN.md`](../docs/DESIGN.md).
