# ATHENA · forecasting wireframe

Clickable, static wireframe of the ATHENA pharma forecasting flow for stakeholder feedback.
No backend, no auth, no real data. Everything is mock data held in client state.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static bundle in dist/
npm run lint
```

## Flow

Start (Epi or Market) → Forecast level and scope → Assumptions → Inputs → Output.
The start choice sets the accent colour (Market = cobalt, Epi = azure). Steps unlock as prerequisites
are met; changing path or level resets the assumptions table.

## Where to change mock data

| What | File |
|---|---|
| Geographies, products, channels, sources, currencies, SKU packs, analogue sets, default risks and events | `src/data/lists.ts` |
| Assumption parameters per path and level, units, sample values, library items | `src/data/parameters.ts` |
| Sample historical volume file (also offered as a download) | `src/data/history.ts` |
| All forecast numbers (series, bands, scenarios, distribution) | `src/mock/engine.ts` |
| Palette and type tokens | `src/index.css` |

The engine is deterministic: the same inputs always give the same output. It reads a few assumptions
(growth, penetration, share, launch year, net discount) and the Inputs step, so the output reacts to edits.

## Structure

```
src/store/forecast.ts   single Zustand store, step locks, derived helpers
src/steps/              one file per step
src/components/         step rail, summary panel, shared bits
scripts/shots.mjs       Playwright walk-through of all four combinations (screenshots to shots/)
```

`scripts/shots.mjs` needs a running dev server and a Chromium; set `CHROME` to a `chrome.exe` path if
Playwright's own browser is not installed.
