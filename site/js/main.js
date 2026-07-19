import { loadEngine } from "./engine.js";
import { createLadderView } from "./book-view.js";
import { crossesWowThreshold } from "./ladder-model.js";
import { formatSize, formatUsd } from "./format.js";

const els = {
  ladder: document.getElementById("ladder"),
  slider: document.getElementById("size-slider"),
  sizeReadout: document.getElementById("size-readout"),
  statBest: document.getElementById("stat-best"),
  statAvg: document.getElementById("stat-avg"),
  statSlippage: document.getElementById("stat-slippage"),
  statUnfilled: document.getElementById("stat-unfilled"),
  slippageCallout: document.getElementById("slippage-callout"),
  errorState: document.getElementById("error-state"),
  layout: document.querySelector(".layout"),
  timelineStrip: document.querySelector(".timeline-strip"),
};

const WOW_PULSE_MS = 900;

function toLevels(pairs) {
  return pairs.map(([price, size]) => ({ price, size }));
}

async function loadScenario(key) {
  const res = await fetch(`./data/snapshots-${key}.json`);
  if (!res.ok) throw new Error(`failed to load scenario "${key}": ${res.status}`);
  const doc = await res.json();
  return {
    ...doc,
    snapshots: doc.snapshots.map((s) => ({
      t: s.t,
      bids: toLevels(s.bids),
      asks: toLevels(s.asks),
    })),
  };
}

function showFatalError() {
  els.errorState.hidden = false;
  if (els.layout) els.layout.hidden = true;
  if (els.timelineStrip) els.timelineStrip.hidden = true;
}

async function main() {
  let engine;
  let scenario;
  try {
    [engine, scenario] = await Promise.all([loadEngine(), loadScenario("calm")]);
  } catch (err) {
    console.error(err);
    showFatalError();
    return;
  }

  const ladderView = createLadderView(els.ladder);
  const sideButtons = document.querySelectorAll(".side-btn");
  let side = "buy";
  const snapshot = scenario.snapshots[0];
  let prevSlippageCost = 0;

  function currentLevels() {
    return side === "buy" ? snapshot.asks : snapshot.bids;
  }

  function sideDepth() {
    return currentLevels().reduce((sum, l) => sum + l.size, 0);
  }

  function configureSlider({ resetValue } = { resetValue: false }) {
    const depth = sideDepth();
    const prevFraction = Number(els.slider.max) > 0 ? Number(els.slider.value) / Number(els.slider.max) : 0;
    els.slider.max = String(depth * 1.3);
    els.slider.step = String(Math.max(depth / 1000, 1e-9));
    els.slider.value = resetValue ? "0" : String(prevFraction * Number(els.slider.max));
  }

  function setSide(newSide) {
    if (newSide === side) return;
    side = newSide;
    sideButtons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.side === side));
    });
    configureSlider();
    update();
  }

  function update() {
    const orderSize = Number(els.slider.value);
    els.sizeReadout.textContent = formatSize(orderSize);

    const levels = currentLevels();
    const fill = orderSize > 0 ? engine.simulateMarketOrder(levels, side === "buy", orderSize) : null;

    ladderView.render(snapshot, fill, side);

    const bestPrice = levels[0]?.price;
    els.statBest.textContent = Number.isFinite(bestPrice) ? formatUsd(bestPrice) : "—";
    els.statAvg.textContent = fill ? formatUsd(fill.avg_price) : "—";
    els.statUnfilled.textContent = fill ? formatSize(fill.unfilled_size) : "—";

    const slippageCost = fill?.slippage_cost ?? 0;
    els.statSlippage.textContent = formatUsd(slippageCost);

    if (crossesWowThreshold(prevSlippageCost, slippageCost)) {
      els.slippageCallout.classList.add("wow-pulse");
      setTimeout(() => els.slippageCallout.classList.remove("wow-pulse"), WOW_PULSE_MS);
    }
    prevSlippageCost = slippageCost;
  }

  configureSlider({ resetValue: true });
  els.slider.addEventListener("input", update);
  sideButtons.forEach((btn) => {
    btn.addEventListener("click", () => setSide(btn.dataset.side));
  });
  update();
}

main();
