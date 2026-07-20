import { loadEngine } from "./engine.js";
import { createLadderView } from "./book-view.js";
import { crossesWowThreshold } from "./ladder-model.js";
import { formatSize, formatUsd } from "./format.js";
import { clampTimelineIndex, formatSnapshotTime } from "./timeline.js";
import { createAudio } from "./audio.js";
import { tweenValue } from "./tween.js";

const SCENARIO_KEYS = ["calm", "thin"];
const WOW_PULSE_MS = 900;
const PLAY_INTERVAL_MS = 900;
const COUNTER_TWEEN_MS = 120;

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
  scenarioSelect: document.getElementById("scenario"),
  timelineSlider: document.getElementById("timeline-slider"),
  timelineReadout: document.getElementById("timeline-readout"),
  timelinePlay: document.getElementById("timeline-play"),
  muteToggle: document.getElementById("mute-toggle"),
};

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
  let scenarios;
  try {
    const [loadedEngine, ...loadedScenarios] = await Promise.all([
      loadEngine(),
      ...SCENARIO_KEYS.map(loadScenario),
    ]);
    engine = loadedEngine;
    scenarios = Object.fromEntries(SCENARIO_KEYS.map((key, i) => [key, loadedScenarios[i]]));
  } catch (err) {
    console.error(err);
    showFatalError();
    return;
  }

  const ladderView = createLadderView(els.ladder);
  const audio = createAudio();
  const sideButtons = document.querySelectorAll(".side-btn");

  els.muteToggle.setAttribute("aria-pressed", String(audio.isMuted()));
  els.muteToggle.addEventListener("click", () => {
    audio.setMuted(!audio.isMuted());
    els.muteToggle.setAttribute("aria-pressed", String(audio.isMuted()));
  });

  els.scenarioSelect.innerHTML = "";
  for (const key of SCENARIO_KEYS) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = scenarios[key].label;
    els.scenarioSelect.appendChild(option);
  }

  let scenarioKey = SCENARIO_KEYS[0];
  let snapshotIndex = 0;
  let side = "buy";
  let prevSlippageCost = 0;
  let displayedSlippageCost = 0;
  let tweenFrame = null;
  let playTimer = null;

  function animateSlippageTo(target) {
    if (tweenFrame !== null) cancelAnimationFrame(tweenFrame);
    const from = displayedSlippageCost;
    const start = performance.now();
    function step(now) {
      const t = (now - start) / COUNTER_TWEEN_MS;
      displayedSlippageCost = tweenValue(from, target, t);
      els.statSlippage.textContent = formatUsd(displayedSlippageCost);
      tweenFrame = t < 1 ? requestAnimationFrame(step) : null;
    }
    tweenFrame = requestAnimationFrame(step);
  }

  function snapshots() {
    return scenarios[scenarioKey].snapshots;
  }

  function currentSnapshot() {
    return snapshots()[snapshotIndex];
  }

  function currentLevels() {
    const s = currentSnapshot();
    return side === "buy" ? s.asks : s.bids;
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

  function updateTimelineReadout() {
    const total = snapshots().length;
    els.timelineReadout.textContent = `${snapshotIndex + 1}/${total} · ${formatSnapshotTime(currentSnapshot().t)}`;
  }

  function goToSnapshot(index, { crossfade } = { crossfade: true }) {
    snapshotIndex = clampTimelineIndex(index, snapshots().length);
    els.timelineSlider.value = String(snapshotIndex);
    updateTimelineReadout();
    configureSlider();
    if (crossfade) {
      els.ladder.classList.add("scrub-dim");
      requestAnimationFrame(() => requestAnimationFrame(() => els.ladder.classList.remove("scrub-dim")));
    }
    update();
  }

  function stopPlayback() {
    if (playTimer !== null) {
      clearInterval(playTimer);
      playTimer = null;
    }
    els.timelinePlay.setAttribute("aria-pressed", "false");
  }

  function togglePlayback() {
    if (playTimer !== null) {
      stopPlayback();
      return;
    }
    els.timelinePlay.setAttribute("aria-pressed", "true");
    playTimer = setInterval(() => {
      const next = snapshotIndex + 1;
      if (next >= snapshots().length) {
        stopPlayback();
        return;
      }
      goToSnapshot(next);
    }, PLAY_INTERVAL_MS);
  }

  function setScenario(key) {
    stopPlayback();
    scenarioKey = key;
    els.timelineSlider.max = String(snapshots().length - 1);
    snapshotIndex = 0;
    els.timelineSlider.value = "0";
    updateTimelineReadout();
    configureSlider({ resetValue: true });
    update();
  }

  function update() {
    const orderSize = Number(els.slider.value);
    els.sizeReadout.textContent = formatSize(orderSize);

    const levels = currentLevels();
    const fill = orderSize > 0 ? engine.simulateMarketOrder(levels, side === "buy", orderSize) : null;

    ladderView.render(currentSnapshot(), fill, side, {
      onLevelConsumed: (index) => audio.levelTick(index),
    });

    const bestPrice = levels[0]?.price;
    els.statBest.textContent = Number.isFinite(bestPrice) ? formatUsd(bestPrice) : "Not set";
    els.statAvg.textContent = fill ? formatUsd(fill.avg_price) : "Not set";
    els.statUnfilled.textContent = fill ? formatSize(fill.unfilled_size) : "Not set";

    const slippageCost = fill?.slippage_cost ?? 0;
    animateSlippageTo(slippageCost);
    if (slippageCost > 0) audio.counterClick();

    if (crossesWowThreshold(prevSlippageCost, slippageCost)) {
      els.slippageCallout.classList.add("wow-pulse");
      setTimeout(() => els.slippageCallout.classList.remove("wow-pulse"), WOW_PULSE_MS);
      audio.wowMoment();
    }
    prevSlippageCost = slippageCost;
  }

  els.scenarioSelect.value = scenarioKey;
  els.timelineSlider.max = String(snapshots().length - 1);
  updateTimelineReadout();
  configureSlider({ resetValue: true });

  els.slider.addEventListener("input", update);
  sideButtons.forEach((btn) => {
    btn.addEventListener("click", () => setSide(btn.dataset.side));
  });
  els.scenarioSelect.addEventListener("change", (e) => setScenario(e.target.value));
  els.timelineSlider.addEventListener("input", (e) => {
    stopPlayback();
    goToSnapshot(Number(e.target.value));
  });
  els.timelineSlider.addEventListener("change", () => audio.scrubWhoosh());
  els.timelinePlay.addEventListener("click", togglePlayback);

  update();
}

main();
