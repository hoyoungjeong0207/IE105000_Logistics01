/**
 * config.js — All game data lives here.
 * Edit this file to change regions, costs, demand, or game rules.
 * No other file needs to change for data adjustments.
 */

const CONFIG = {

  // ── Leaderboard backend (Streamlit app) ───────────────────────────────────
  // Paste the Streamlit Community Cloud URL after deploying leaderboard.py
  leaderboard: {
    streamlitUrl: "STREAMLIT_URL",
  },

  // ── Starting budget ────────────────────────────────────────────────────────
  budget: {
    initial: 500_000,
  },

  // ── Game mode ──────────────────────────────────────────────────────────────
  gameMode: {
    periods: 1,
    showCostBreakdown: true,
  },

  // ── World regions ──────────────────────────────────────────────────────────
  // mapPos: percentage (x%, y%) on the world map image
  // facilityCosts: per-region values for buildCost, opCostPerUnit, outputPerPeriod
  //   opCostPerUnit = variable operating cost charged per unit produced/sold
  regions: {
    NorthAmerica: {
      label: "North America",
      demand: 120,
      marketPrice: 200,
      mapPos: { x: 24, y: 32 },
      facilityCosts: {
        mine:     { buildCost: 100_000, opCostPerUnit: 115, outputPerPeriod: 80  },
        factory:  { buildCost: 200_000, opCostPerUnit: 135, outputPerPeriod: 220 },
        salesHub: { buildCost: 60_000,  opCostPerUnit: 70 },
      },
    },
    SouthAmerica: {
      label: "South America",
      demand: 60,
      marketPrice: 160,
      mapPos: { x: 31, y: 65 },
      facilityCosts: {
        mine:     { buildCost: 70_000,  opCostPerUnit: 70,  outputPerPeriod: 110 },
        factory:  { buildCost: 130_000, opCostPerUnit: 90,  outputPerPeriod: 160 },
        salesHub: { buildCost: 35_000,  opCostPerUnit: 35 },
      },
    },
    Europe: {
      label: "Europe",
      demand: 100,
      marketPrice: 225,
      mapPos: { x: 50, y: 24 },
      facilityCosts: {
        mine:     { buildCost: 120_000, opCostPerUnit: 140, outputPerPeriod: 60  },
        factory:  { buildCost: 180_000, opCostPerUnit: 145, outputPerPeriod: 200 },
        salesHub: { buildCost: 70_000,  opCostPerUnit: 85 },
      },
    },
    Africa: {
      label: "Africa",
      demand: 50,
      marketPrice: 140,
      mapPos: { x: 52, y: 57 },
      facilityCosts: {
        mine:     { buildCost: 55_000,  opCostPerUnit: 40,  outputPerPeriod: 130 },
        factory:  { buildCost: 100_000, opCostPerUnit: 70,  outputPerPeriod: 140 },
        salesHub: { buildCost: 25_000,  opCostPerUnit: 25 },
      },
    },
    MiddleEast: {
      label: "Middle East",
      demand: 40,
      marketPrice: 175,
      mapPos: { x: 59, y: 38 },
      facilityCosts: {
        mine:     { buildCost: 65_000,  opCostPerUnit: 55,  outputPerPeriod: 100 },
        factory:  { buildCost: 140_000, opCostPerUnit: 95,  outputPerPeriod: 170 },
        salesHub: { buildCost: 40_000,  opCostPerUnit: 50 },
      },
    },
    Asia: {
      label: "Asia",
      demand: 150,
      marketPrice: 150,
      mapPos: { x: 74, y: 28 },
      facilityCosts: {
        mine:     { buildCost: 75_000,  opCostPerUnit: 80,  outputPerPeriod: 120 },
        factory:  { buildCost: 120_000, opCostPerUnit: 55,  outputPerPeriod: 210 },
        salesHub: { buildCost: 50_000,  opCostPerUnit: 65 },
      },
    },
    Oceania: {
      label: "Oceania",
      demand: 30,
      marketPrice: 190,
      mapPos: { x: 80, y: 68 },
      facilityCosts: {
        mine:     { buildCost: 80_000,  opCostPerUnit: 90,  outputPerPeriod: 90  },
        factory:  { buildCost: 160_000, opCostPerUnit: 105, outputPerPeriod: 180 },
        salesHub: { buildCost: 30_000,  opCostPerUnit: 55 },
      },
    },
  },

  // ── Facilities ─────────────────────────────────────────────────────────────
  // buildCost / opCostPerUnit / outputPerPeriod vary by region — see facilityCosts above.
  facilities: {
    mine: {
      label: "Mine",
      emoji: "⛏️",
      description: "Extracts raw materials. Cost and output vary by region.",
    },
    factory: {
      label: "Factory",
      emoji: "🏭",
      description: "Produces finished goods. Cost and output vary by region.",
    },
    salesHub: {
      label: "Sales Hub",
      emoji: "🏪",
      outputPerPeriod: 0,   // never produces — only sells
      description: "Sells goods to local customers. Required to earn revenue.",
    },
  },

  // ── Transport cost ($/unit) between regions ────────────────────────────────
  // transportCost[origin][destination]
  transportCost: {
    NorthAmerica: { SouthAmerica: 4,  Europe: 6,  Africa: 9,  MiddleEast: 11, Asia: 13, Oceania: 14 },
    SouthAmerica: { NorthAmerica: 4,  Europe: 8,  Africa: 7,  MiddleEast: 12, Asia: 15, Oceania: 13 },
    Europe:       { NorthAmerica: 6,  SouthAmerica: 8,  Africa: 5,  MiddleEast: 6,  Asia: 9,  Oceania: 14 },
    Africa:       { NorthAmerica: 9,  SouthAmerica: 7,  Europe: 5,  MiddleEast: 5,  Asia: 10, Oceania: 12 },
    MiddleEast:   { NorthAmerica: 11, SouthAmerica: 12, Europe: 6,  Africa: 5,  Asia: 6,  Oceania: 9  },
    Asia:         { NorthAmerica: 13, SouthAmerica: 15, Europe: 9,  Africa: 10, MiddleEast: 6,  Oceania: 5  },
    Oceania:      { NorthAmerica: 14, SouthAmerica: 13, Europe: 14, Africa: 12, MiddleEast: 9,  Asia: 5     },
  },
};
