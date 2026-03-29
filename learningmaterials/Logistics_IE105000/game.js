/**
 * game.js — Core game logic.
 * All data comes from CONFIG (config.js).
 */

// ── Streamlit leaderboard helper ──────────────────────────────────────────────

const STREAMLIT = () => CONFIG.leaderboard.streamlitUrl;

// ── Stage announcements ───────────────────────────────────────────────────────

const STAGES = [
  {
    id: "needMine",
    text: "⛏️ Step 1: Build a Mine — select Mine below, then click a region to extract raw materials",
  },
  {
    id: "needFactory",
    text: "🏭 Step 2: Build a Factory — it will receive raw materials from your Mine",
  },
  {
    id: "needHub",
    text: "🏪 Step 3: Build a Sales Hub — finished goods will be shipped here to sell",
  },
  {
    id: "ready",
    text: "✅ Chain complete: ⛏️ Mine →🔴→ 🏭 Factory →🔵→ 🏪 Hub   Click ▶ Simulate!",
  },
];

// ── Game state ────────────────────────────────────────────────────────────────

const state = {
  budget:      CONFIG.budget.initial,
  totalProfit: 0,
  activeMode:  null,       // "mine" | "factory" | "salesHub" | null
  facilities:  {},         // { regionId: facilityType }
  routes:      [],         // [{ from, to }]
};

// ── Image bounds (accounts for object-fit: contain) ──────────────────────────

function getImageBounds() {
  const container = document.getElementById('map-container');
  const img       = document.getElementById('map-img');
  const cW = container.offsetWidth;
  const cH = container.offsetHeight;
  const iW = img.naturalWidth  || 1280;
  const iH = img.naturalHeight || 640;
  const imgRatio = iW / iH;
  const conRatio = cW / cH;

  let w, h, x, y;
  if (imgRatio > conRatio) {
    w = cW; h = cW / imgRatio;
    x = 0;  y = (cH - h) / 2;
  } else {
    h = cH; w = cH * imgRatio;
    y = 0;  x = (cW - w) / 2;
  }
  return { x, y, w, h };
}

// ── Facility config helper (merges global label/emoji with per-region costs) ──

function getFacilityCfg(regionId, facType) {
  const base     = CONFIG.facilities[facType] ?? {};
  const override = CONFIG.regions[regionId]?.facilityCosts?.[facType] ?? {};
  return { ...base, ...override };
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Toolbar cost labels show "varies" since costs differ by region
  for (const fId of Object.keys(CONFIG.facilities)) {
    const el = document.getElementById(`cost-${fId}`);
    if (el) el.textContent = fId === 'salesHub' ? 'varies' : 'varies';
  }

  // Re-render pins when image loads (to get correct naturalWidth/Height)
  const img = document.getElementById('map-img');
  if (img.complete) { renderPins(); } else { img.addEventListener('load', renderPins); }

  // Re-render on resize
  window.addEventListener('resize', () => { renderPins(); });

  updateHUD();
  setAnnouncement(STAGES[0].text);

  // Toolbar buttons
  for (const [fId] of Object.entries(CONFIG.facilities)) {
    document.getElementById(`btn-${fId}`)
      ?.addEventListener('click', () => toggleMode(fId));
  }
  document.getElementById('btn-simulate').addEventListener('click', onSimulate);
  document.getElementById('btn-restart').addEventListener('click', onRestart);

  // ── Leaderboard wiring ────────────────────────────────────────────────────
  document.getElementById('btn-leaderboard').addEventListener('click', openLeaderboard);
  document.getElementById('lb-close').addEventListener('click', closeLeaderboard);
});

// ── Mode (active build tool) ──────────────────────────────────────────────────

function toggleMode(fId) {
  // Enforce sequential build order
  const hasMine    = Object.values(state.facilities).some(f => f === 'mine');
  const hasFactory = Object.values(state.facilities).some(f => f === 'factory');
  if (fId === 'factory' && !hasMine) {
    toast('⛏️ Build a Mine first!'); return;
  }
  if (fId === 'salesHub' && !hasFactory) {
    toast('🏭 Build a Factory first!'); return;
  }

  if (state.activeMode === fId) {
    state.activeMode = null;
    document.body.classList.remove('build-mode');
  } else {
    state.activeMode = fId;
    document.body.classList.add('build-mode');
    const fCfg = CONFIG.facilities[fId];
    toast(`${fCfg.emoji} ${fCfg.label} selected — click a region to place it`);
  }
  updateToolbarActive();
}

function clearMode() {
  state.activeMode = null;
  document.body.classList.remove('build-mode');
  updateToolbarActive();
}

function updateToolbarActive() {
  const hasMine    = Object.values(state.facilities).some(f => f === 'mine');
  const hasFactory = Object.values(state.facilities).some(f => f === 'factory');

  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  if (state.activeMode) {
    document.getElementById(`btn-${state.activeMode}`)?.classList.add('active');
  }

  // Grey out buttons whose prerequisites aren't met
  const btnFactory  = document.getElementById('btn-factory');
  const btnSalesHub = document.getElementById('btn-salesHub');
  if (btnFactory)  btnFactory.classList.toggle('locked', !hasMine);
  if (btnSalesHub) btnSalesHub.classList.toggle('locked', !hasFactory);
}

// ── Pins ──────────────────────────────────────────────────────────────────────

function renderPins() {
  const container = document.getElementById('map-pins');
  container.innerHTML = '';
  const b = getImageBounds();

  for (const [id, region] of Object.entries(CONFIG.regions)) {
    const facility = state.facilities[id];
    const fCfg     = facility ? CONFIG.facilities[facility] : null;

    const pin = document.createElement('div');
    pin.className = 'region-pin' + (facility ? ' has-facility' : '');
    pin.id = `pin-${id}`;
    pin.style.left = (b.x + (region.mapPos.x / 100) * b.w) + 'px';
    pin.style.top  = (b.y + (region.mapPos.y / 100) * b.h) + 'px';
    pin.dataset.region = id;

    pin.innerHTML = `
      <div class="pin-circle">${region.label.split(' ').map(w => w[0]).join('')}</div>
      ${fCfg ? `<div class="pin-emoji">${fCfg.emoji}</div>` : ''}
      <div class="pin-label">${region.label}</div>
    `;

    pin.addEventListener('click', () => onRegionClick(id));
    container.appendChild(pin);
  }

  renderRoutes();
}

function renderRoutes() {
  const svg = document.getElementById('route-svg');
  svg.innerHTML = '';
  const b = getImageBounds();

  for (const route of state.routes) {
    const from = CONFIG.regions[route.from];
    const to   = CONFIG.regions[route.to];
    if (!from || !to) continue;

    const cls = route.type === 'mine-factory' ? 'route-mine-factory' : 'route-factory-hub';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', b.x + (from.mapPos.x / 100) * b.w);
    line.setAttribute('y1', b.y + (from.mapPos.y / 100) * b.h);
    line.setAttribute('x2', b.x + (to.mapPos.x   / 100) * b.w);
    line.setAttribute('y2', b.y + (to.mapPos.y   / 100) * b.h);
    line.setAttribute('class', cls);
    svg.appendChild(line);
  }
}

// ── Region click — show popup ─────────────────────────────────────────────────

function onRegionClick(regionId) {
  showPopup(regionId);
}

function showPopup(regionId) {
  const region   = CONFIG.regions[regionId];
  const existing = state.facilities[regionId];
  const fCfg     = existing ? getFacilityCfg(regionId, existing) : null;
  const mode     = state.activeMode;
  const modeCfg  = mode ? getFacilityCfg(regionId, mode) : null;

  // Position popup near the pin
  const b    = getImageBounds();
  const pinX = b.x + (region.mapPos.x / 100) * b.w;
  const pinY = b.y + (region.mapPos.y / 100) * b.h;
  const popup = document.getElementById('region-popup');
  const mapEl = document.getElementById('map-container');

  // Offset popup so it doesn't overlap the pin; clamp inside map
  let left = pinX + 18;
  let top  = pinY - 20;
  if (left + 270 > mapEl.offsetWidth)  left = pinX - 278;
  if (top  + 240 > mapEl.offsetHeight) top  = mapEl.offsetHeight - 245;
  if (top < 10) top = 10;
  popup.style.left = left + 'px';
  popup.style.top  = top  + 'px';

  // Header
  document.getElementById('popup-region-name').textContent =
    `${fCfg ? fCfg.emoji + ' ' : ''}${region.label}`;

  // Region stats
  document.getElementById('popup-demand').textContent = `${region.demand} units`;
  document.getElementById('popup-price').textContent  = `$${region.marketPrice}/unit`;

  // Facility info section
  const infoEl = document.getElementById('popup-facility-info');
  if (existing) {
    // Show current facility stats
    infoEl.innerHTML = `
      <div class="popup-fac-title">${fCfg.emoji} ${fCfg.label} (built)</div>
      <div class="popup-fac-row"><span>Build cost</span><span>$${fCfg.buildCost.toLocaleString()}</span></div>
      <div class="popup-fac-row"><span>Op. cost</span><span>$${fCfg.opCostPerUnit.toLocaleString()}/unit</span></div>
      ${fCfg.outputPerPeriod > 0 ? `<div class="popup-fac-row"><span>Max output</span><span>${fCfg.outputPerPeriod} units</span></div>` : ''}
    `;
  } else if (modeCfg) {
    // Show the selected facility to build
    infoEl.innerHTML = `
      <div class="popup-fac-title">${modeCfg.emoji} Build ${modeCfg.label} here?</div>
      <div class="popup-fac-row"><span>Build cost</span><span style="color:#e57373">-$${modeCfg.buildCost.toLocaleString()}</span></div>
      <div class="popup-fac-row"><span>Op. cost</span><span>$${modeCfg.opCostPerUnit.toLocaleString()}/unit</span></div>
      ${modeCfg.outputPerPeriod > 0 ? `<div class="popup-fac-row"><span>Max output</span><span>${modeCfg.outputPerPeriod} units</span></div>` : ''}
      <div class="popup-fac-row"><span>Budget after</span><span style="color:${state.budget - modeCfg.buildCost >= 0 ? '#81c784' : '#e57373'}">$${(state.budget - modeCfg.buildCost).toLocaleString()}</span></div>
    `;
  } else {
    infoEl.innerHTML = `<div style="color:#888;font-size:0.78rem">Select a facility button below to build here.</div>`;
  }

  // Action buttons
  const actEl = document.getElementById('popup-actions');
  actEl.innerHTML = '';

  if (existing) {
    const delBtn = document.createElement('button');
    delBtn.className = 'popup-btn-delete';
    delBtn.textContent = '🗑️ Remove';
    delBtn.onclick = () => { removeFacility(regionId); closePopup(); };
    actEl.appendChild(delBtn);
  } else if (modeCfg) {
    const buildBtn = document.createElement('button');
    buildBtn.className = 'popup-btn-build';
    buildBtn.textContent = `✓ Build ${modeCfg.label}`;
    buildBtn.disabled = state.budget < modeCfg.buildCost;
    buildBtn.onclick = () => { buildFacility(regionId); closePopup(); };
    actEl.appendChild(buildBtn);
  }

  popup.classList.remove('hidden');
}

function closePopup() {
  document.getElementById('region-popup').classList.add('hidden');
}

// ── Build / Remove ────────────────────────────────────────────────────────────

function buildFacility(regionId) {
  const fCfg = getFacilityCfg(regionId, state.activeMode);
  if (!fCfg || state.budget < fCfg.buildCost) return;

  state.budget -= fCfg.buildCost;
  state.facilities[regionId] = state.activeMode;
  autoConnectRoutes(regionId, state.activeMode);
  toast(`${fCfg.emoji} ${fCfg.label} built in ${CONFIG.regions[regionId].label}!`);
  clearMode();
  updateHUD();
  renderPins();
  updateStageAnnouncement();
  updateToolbarActive();
}

function removeFacility(regionId) {
  const existing = state.facilities[regionId];
  if (!existing) return;
  const fCfg = CONFIG.facilities[existing];
  delete state.facilities[regionId];
  state.routes = state.routes.filter(r => r.from !== regionId && r.to !== regionId);
  toast(`🗑️ ${fCfg.emoji} removed from ${CONFIG.regions[regionId].label}`);
  updateHUD();
  renderPins();
  updateStageAnnouncement();
  updateToolbarActive();
}

// ── Auto-route ────────────────────────────────────────────────────────────────
// Chain: Mine --[red]--> Factory --[blue]--> Sales Hub

function autoConnectRoutes(newRegionId, facilityType) {
  if (facilityType === 'mine') {
    // Connect to all existing factories (red)
    for (const [rId, fId] of Object.entries(state.facilities)) {
      if (rId === newRegionId) continue;
      if (fId === 'factory') addRoute(newRegionId, rId, 'mine-factory');
    }
  } else if (facilityType === 'factory') {
    // Connect from all existing mines (red) + to all existing hubs (blue)
    for (const [rId, fId] of Object.entries(state.facilities)) {
      if (rId === newRegionId) continue;
      if (fId === 'mine')     addRoute(rId, newRegionId, 'mine-factory');
      if (fId === 'salesHub') addRoute(newRegionId, rId, 'factory-hub');
    }
  } else if (facilityType === 'salesHub') {
    // Connect from all existing factories (blue)
    for (const [rId, fId] of Object.entries(state.facilities)) {
      if (rId === newRegionId) continue;
      if (fId === 'factory') addRoute(rId, newRegionId, 'factory-hub');
    }
  }
}

function addRoute(from, to, type) {
  const exists = state.routes.some(r => r.from === from && r.to === to);
  if (!exists) state.routes.push({ from, to, type });
}

// ── Stage announcement ────────────────────────────────────────────────────────

function updateStageAnnouncement() {
  const hasMine    = Object.values(state.facilities).some(f => f === 'mine');
  const hasFactory = Object.values(state.facilities).some(f => f === 'factory');
  const hasHub     = Object.values(state.facilities).some(f => f === 'salesHub');

  if (!hasMine)         setAnnouncement(STAGES[0].text);
  else if (!hasFactory) setAnnouncement(STAGES[1].text);
  else if (!hasHub)     setAnnouncement(STAGES[2].text);
  else                  setAnnouncement(STAGES[3].text);
}

function setAnnouncement(text) {
  document.getElementById('announcement-text').textContent = text;
}

// ── Simulate ──────────────────────────────────────────────────────────────────

function onSimulate() {
  const hasMine    = Object.values(state.facilities).some(f => f === 'mine');
  const hasFactory = Object.values(state.facilities).some(f => f === 'factory');
  const hasHub     = Object.values(state.facilities).some(f => f === 'salesHub');

  if (!hasMine)    { toast('⛏️ Build a Mine first!');    return; }
  if (!hasFactory) { toast('🏭 Build a Factory first!'); return; }
  if (!hasHub)     { toast('🏪 Build a Sales Hub first!'); return; }

  const result = calculateResult();
  state.totalProfit = result.netProfit;
  updateHUD();
  showResultOverlay(result);
}

function calculateResult() {
  let revenue       = 0;
  let opCost        = 0;
  let transportCost = 0;
  const rows        = [];

  // Operating costs computed per-unit at the end (accumulated below)

  // Two-stage chain: Mine → Factory → Sales Hub
  // For each Factory→Hub route, check if the factory has at least one Mine feeding it
  const sfRoutes = state.routes.filter(r => r.type === 'mine-factory');
  const fhRoutes = state.routes.filter(r => r.type === 'factory-hub');

  for (const fhRoute of fhRoutes) {
    const factoryId = fhRoute.from;
    const hubId     = fhRoute.to;
    if (state.facilities[factoryId] !== 'factory')  continue;
    if (state.facilities[hubId]     !== 'salesHub') continue;

    // Find mines feeding this factory
    const feedingMines = sfRoutes.filter(r => r.to === factoryId);
    if (feedingMines.length === 0) continue;  // factory has no raw material

    // Raw material available = sum of per-region mine outputs
    const rawSupply = feedingMines.reduce((sum, r) => {
      return sum + (getFacilityCfg(r.from, 'mine').outputPerPeriod ?? 0);
    }, 0);

    const factoryCfg = getFacilityCfg(factoryId, 'factory');
    const hubRegion  = CONFIG.regions[hubId];
    const units      = Math.min(rawSupply, factoryCfg.outputPerPeriod, hubRegion.demand);

    // Transport: average mine→factory cost + factory→hub cost
    const mineTransportCost = feedingMines.reduce((sum, r) => {
      return sum + (CONFIG.transportCost[r.from]?.[factoryId] ?? 0);
    }, 0) / feedingMines.length;
    const hubTransportCost = CONFIG.transportCost[factoryId]?.[hubId] ?? 0;

    const rev   = units * hubRegion.marketPrice;
    const trans = units * (mineTransportCost + hubTransportCost);

    // Per-unit operating costs: avg mine op + factory op + hub op
    const mineOpPerUnit = feedingMines.reduce((sum, r) => {
      return sum + (getFacilityCfg(r.from, 'mine').opCostPerUnit ?? 0);
    }, 0) / feedingMines.length;
    const facOpPerUnit = getFacilityCfg(factoryId, 'factory').opCostPerUnit ?? 0;
    const hubOpPerUnit = getFacilityCfg(hubId, 'salesHub').opCostPerUnit ?? 0;
    const op = units * (mineOpPerUnit + facOpPerUnit + hubOpPerUnit);

    revenue       += rev;
    transportCost += trans;
    opCost        += op;

    const mineLabel = feedingMines.map(r => CONFIG.regions[r.from].label).join(', ');
    rows.push({
      label:     `${mineLabel} → ${CONFIG.regions[factoryId].label} → ${hubRegion.label}`,
      units,
      revenue:   rev,
      transport: trans,
      opCost:    op,
    });
  }

  return {
    revenue,
    opCost,
    transportCost,
    netProfit: revenue - opCost - transportCost,
    rows,
  };
}

function showResultOverlay(result) {
  const profitColor = result.netProfit >= 0 ? 'green' : 'red';

  const rowsHtml = result.rows.map(r => `
    <div class="result-row">
      <span>${r.label} (${r.units} units)</span>
      <span class="green">+$${r.revenue.toLocaleString()}</span>
    </div>
    <div class="result-row" style="font-size:0.78rem;color:#aaa">
      <span>&nbsp;&nbsp;Operating cost</span>
      <span class="red">-$${r.opCost.toLocaleString()}</span>
    </div>
    <div class="result-row" style="font-size:0.78rem;color:#aaa">
      <span>&nbsp;&nbsp;Transport cost</span>
      <span class="red">-$${r.transport.toLocaleString()}</span>
    </div>
  `).join('');

  document.getElementById('result-rows').innerHTML = `
    ${rowsHtml}
    <div class="result-row total">
      <span>Net Profit</span>
      <span class="${profitColor}">$${result.netProfit.toLocaleString()}</span>
    </div>
  `;

  document.getElementById('result-overlay').classList.remove('hidden');

  // Wire submit button with current result
  document.getElementById('btn-submit-score').onclick = () => submitScore(result);
}

function submitScore(result) {
  const name = document.getElementById('player-name').value.trim();
  if (!name) { toast('Enter your name first!'); return; }

  const url = STREAMLIT();
  if (!url || url === 'STREAMLIT_URL') { toast('Leaderboard not configured yet.'); return; }

  const sfRoutes = state.routes.filter(r => r.type === 'mine-factory');
  const fhRoutes = state.routes.filter(r => r.type === 'factory-hub');
  const chainParts = fhRoutes.map(fh => {
    const mines = sfRoutes.filter(r => r.to === fh.from).map(r => CONFIG.regions[r.from].label).join('+');
    return `${mines} → ${CONFIG.regions[fh.from].label} → ${CONFIG.regions[fh.to].label}`;
  });

  const params = new URLSearchParams({
    name,
    profit: result.netProfit,
    units:  result.rows.reduce((s, r) => s + r.units, 0),
    chain:  chainParts.join(' | '),
  });

  window.open(`${url}/?${params}`, '_blank');
  toast(`🏆 Opening leaderboard for ${name}!`);
}

// ── Leaderboard overlay ───────────────────────────────────────────────────────

function openLeaderboard() {
  const url = STREAMLIT();
  if (!url || url === 'STREAMLIT_URL') { toast('Leaderboard not configured yet.'); return; }
  document.getElementById('lb-iframe').src = url;
  document.getElementById('lb-overlay').classList.remove('hidden');
}

function closeLeaderboard() {
  document.getElementById('lb-overlay').classList.add('hidden');
  document.getElementById('lb-iframe').src = '';
}


function onRestart() {
  state.budget      = CONFIG.budget.initial;
  state.totalProfit = 0;
  state.activeMode  = null;
  state.facilities  = {};
  state.routes      = [];

  document.body.classList.remove('build-mode');
  document.getElementById('result-overlay').classList.add('hidden');
  updateToolbarActive();
  updateHUD();
  renderPins();
  setAnnouncement(STAGES[0].text);
}

// ── HUD ───────────────────────────────────────────────────────────────────────

function calcExpectedUnits() {
  const sfRoutes = state.routes.filter(r => r.type === 'mine-factory');
  const fhRoutes = state.routes.filter(r => r.type === 'factory-hub');
  let total = 0;
  for (const fhRoute of fhRoutes) {
    const factoryId = fhRoute.from;
    const hubId     = fhRoute.to;
    if (state.facilities[factoryId] !== 'factory')  continue;
    if (state.facilities[hubId]     !== 'salesHub') continue;
    const feedingMines = sfRoutes.filter(r => r.to === factoryId);
    if (feedingMines.length === 0) continue;
    const rawSupply  = feedingMines.reduce((s, r) => s + (getFacilityCfg(r.from, 'mine').outputPerPeriod ?? 0), 0);
    const factoryCfg = getFacilityCfg(factoryId, 'factory');
    total += Math.min(rawSupply, factoryCfg.outputPerPeriod, CONFIG.regions[hubId].demand);
  }
  return total;
}

function updateHUD() {
  document.getElementById('hud-budget').textContent = `$${state.budget.toLocaleString()}`;
  const units = calcExpectedUnits();
  document.getElementById('hud-output').textContent = units > 0 ? `${units} units` : '— units';
  const p = document.getElementById('hud-profit');
  p.textContent = `$${state.totalProfit.toLocaleString()}`;
  p.className   = state.totalProfit >= 0 ? 'green' : 'red';
}

// ── Toast ─────────────────────────────────────────────────────────────────────

let toastTimer;
function toast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}
