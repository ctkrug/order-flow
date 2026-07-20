import * as d3 from "d3";
import { buildLadderRows } from "./ladder-model.js";
import { formatSize } from "./format.js";

const FLASH_MS = 120;

/**
 * Creates a stateful D3 ladder renderer bound to `container`. Kept as a
 * factory (not a single pure function) because the "newly consumed" flash
 * needs to remember which prices were consumed on the previous render.
 */
export function createLadderView(container) {
  const root = d3.select(container);
  root.selectAll("*").remove();

  const asksEl = root.append("div").attr("class", "ladder-side asks");
  const midEl = root.append("div").attr("class", "ladder-mid");
  const bidsEl = root.append("div").attr("class", "ladder-side bids");

  let prevConsumedAsks = new Set();
  let prevConsumedBids = new Set();

  function renderSide(sideEl, levels, consumedLevels, sideClass, prevConsumed, onNewlyConsumed) {
    const rows = buildLadderRows(levels, consumedLevels);
    const maxSize = d3.max(rows, (r) => r.size) || 1;
    const nowConsumed = new Set(rows.filter((r) => r.consumed).map((r) => r.price));

    const selection = sideEl
      .selectAll("div.ladder-row")
      .data(rows, (d) => d.price);

    selection.exit().remove();

    const entered = selection
      .enter()
      .append("div")
      .attr("class", `ladder-row ${sideClass}`)
      .each(function appendChildren() {
        const row = d3.select(this);
        row.append("div").attr("class", "depth-remaining");
        row.append("div").attr("class", "depth-taken");
        row.append("span").attr("class", "price");
        row.append("span").attr("class", "size");
        row.append("span").attr("class", "taken");
      });

    const merged = entered.merge(selection);

    merged
      .classed("consumed", (d) => d.consumed)
      .classed("fully-consumed", (d) => d.fullyConsumed)
      .each(function updateRow(d) {
        const row = d3.select(this);
        const isNewlyConsumed = d.consumed && !prevConsumed.has(d.price);
        row.classed("flash", isNewlyConsumed);
        if (isNewlyConsumed) {
          setTimeout(() => row.classed("flash", false), FLASH_MS);
          onNewlyConsumed?.();
        }
      });

    merged
      .select(".depth-taken")
      .style("left", "0%")
      .style("width", (d) => `${(Math.max(d.taken, 0) / maxSize) * 100}%`);

    merged
      .select(".depth-remaining")
      .style("left", (d) => `${(Math.max(d.taken, 0) / maxSize) * 100}%`)
      .style("width", (d) => `${(Math.max(d.remaining, 0) / maxSize) * 100}%`);

    merged.select(".price").text((d) => d.price.toFixed(2));
    merged.select(".size").text((d) => formatSize(d.remaining));
    merged.select(".taken").text((d) => (d.taken > 0 ? `−${formatSize(d.taken)}` : ""));

    return nowConsumed;
  }

  return {
    /**
     * @param {{bids: Array, asks: Array}} book
     * @param {object|null} fillResult from engine.simulateMarketOrder, or null before any order is sized
     * @param {"buy"|"sell"} side
     */
    render(book, fillResult, side, { onLevelConsumed } = {}) {
      const consumedLevels = fillResult?.levels ?? [];
      const askConsumed = side === "buy" ? consumedLevels : [];
      const bidConsumed = side === "sell" ? consumedLevels : [];
      let newlyConsumedCount = 0;
      const bumpTick = () => onLevelConsumed?.(newlyConsumedCount++);

      prevConsumedAsks = renderSide(asksEl, book.asks, askConsumed, "asks", prevConsumedAsks, bumpTick);
      prevConsumedBids = renderSide(bidsEl, book.bids, bidConsumed, "bids", prevConsumedBids, bumpTick);

      const bestBid = book.bids[0]?.price;
      const bestAsk = book.asks[0]?.price;
      midEl.text(
        Number.isFinite(bestBid) && Number.isFinite(bestAsk)
          ? `spread ${(bestAsk - bestBid).toFixed(2)}`
          : "Spread unavailable",
      );
    },
  };
}
