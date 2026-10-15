import { ANALOGUES, FX } from '../data/lists'
import type { State } from '../store/forecast'

// Deterministic mock engine. Same state in, same numbers out. No Math.random.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const Z80 = 1.2816 // P10/P90 z-score

export interface Point {
  label: string
  t: number // years from first forecast period
  hist?: number
  vol?: number // market volume, k units
  p10?: number
  p90?: number
  sdzVol?: number
  netSales?: number // currency M
  nsP10?: number
  nsP90?: number
}
export interface ScenarioRow {
  name: string
  headline: number // market: final-year volume (k). sdz: NPV (M)
  cagr: number
  netSales5y?: number
  peak?: number
  gm?: number
}
export interface Bin { x: number; label: string; p: number }
export interface Result {
  level: 'market' | 'sdz'
  points: Point[]
  scenarios: ScenarioRow[]
  base: ScenarioRow
  bins: Bin[]
  p10: number
  p50: number
  p90: number
  headlineLabel: string
  ccy: string
  ppy: number
}

const num = (s: State, id: string, fallback: number) => {
  const v = parseFloat(s.assumptions.find((a) => a.id === id)?.value ?? '')
  return Number.isFinite(v) ? v : fallback
}

function bucket(period: string, ppy: number) {
  const [y, m] = period.split('-').map(Number)
  if (ppy === 1) return `${y}`
  if (ppy === 4) return `${y} Q${Math.floor((m - 1) / 3) + 1}`
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`
}
function periodLabel(first: number, i: number, ppy: number) {
  const y = first + Math.floor(i / ppy)
  const k = i % ppy
  if (ppy === 1) return `${y}`
  if (ppy === 4) return `${y} Q${k + 1}`
  return `${MONTHS[k]} ${String(y).slice(2)}`
}

function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return x >= 0 ? y : -y
}
const cdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))

export function compute(s: State): Result {
  const level = s.level ?? 'market'
  const ppy = s.scope.granularity === 'Monthly' ? 12 : s.scope.granularity === 'Quarterly' ? 4 : 1
  const { horizon, firstYear, discountRate, mc, currency } = s.model
  const fx = FX[currency]
  const n = horizon * ppy

  // History, aggregated to the chosen granularity.
  const hist = s.inputs.history
  const histPts = new Map<string, number>()
  hist?.forEach((r) => histPts.set(bucket(r.period, ppy), (histPts.get(bucket(r.period, ppy)) ?? 0) + r.volume))
  const last12 = hist ? hist.slice(-12).reduce((a, r) => a + r.volume, 0) : 0
  const a0 = last12 || (s.path === 'epi' ? 9600 : num(s, 'marketSize', 12400))

  // Drivers read from the assumptions and inputs where defined.
  const gBase = num(s, 'growth', s.path === 'epi' ? 4.2 : 3.5) / 100
  const eventShift = s.modules.events
    ? s.inputs.events.reduce((a, e) => a + (e.impact / 100) * (e.likelihood / 100), 0)
    : 0
  const peakPen = num(s, 'gxPen', 38) / 100
  const share = num(s, 'sdzGxShare', num(s, 'sdzShare', 24)) / 100
  const launchYear = num(s, 'launch', 2028)
  const delay = s.inputs.risks.reduce((a, r) => a + (r.likelihood / 100) * (r.delayMonths / 12), 0)
  const compFactor =
    Math.max(0.4, 1 - 0.08 * (s.inputs.entryOrder - 1)) * Math.max(0.5, 1 - 0.02 * s.inputs.competitors)
  const anaFactor = (() => {
    const sel = ANALOGUES.filter((a) => s.inputs.analogues.includes(a.id))
    return sel.length ? sel.reduce((a, x) => a + x.peakShare, 0) / sel.length / 32 : 1
  })()
  const skuIdx = s.modules.sku
    ? s.inputs.skuMix.reduce((a, k) => a + (k.share / 100) * k.priceIndex, 0) || 1
    : 1
  const disc = num(s, 'netDiscount', s.inputs.price.discount) / 100
  const netPrice =
    s.inputs.price.list * (1 - disc) * (1 - s.inputs.price.g2n / 100) * skuIdx * fx
  const unitCost = s.inputs.price.cogs * fx
  const gm = netPrice > 0 ? Math.max(0, (netPrice - unitCost) / netPrice) : 0

  function run(gDelta: number, shareMul: number, withBand: boolean) {
    const g = gBase + gDelta
    const rows = Array.from({ length: n }, (_, i) => {
      const t = i / ppy
      const season = ppy === 12 ? 1 + 0.05 * Math.sin((2 * Math.PI * (i % 12 - 2)) / 12) : 1
      const ev = t >= 1 ? 1 + eventShift : 1
      const vol = (a0 / ppy) * Math.pow(1 + g, t + 1) * ev * season
      const yearsSinceLaunch = firstYear + t - (launchYear + delay)
      const pen = yearsSinceLaunch < 0 ? 0 : peakPen / (1 + Math.exp(-1.1 * (yearsSinceLaunch - 2)))
      const sdzVol = vol * pen * share * shareMul * compFactor * anaFactor
      const ns = (sdzVol * netPrice) / 1000
      const sigma = 0.04 + 0.012 * t
      return { t, vol, sdzVol, ns, sigma }
    })
    const npv = rows.reduce((a, r) => a + r.ns * gm / Math.pow(1 + discountRate / 100, r.t + 0.5 / ppy), 0)
    const yearly = (f: (r: (typeof rows)[0]) => number, y: number) =>
      rows.slice(y * ppy, (y + 1) * ppy).reduce((a, r) => a + f(r), 0)
    const finalVol = yearly((r) => r.vol, horizon - 1)
    const firstVol = yearly((r) => r.vol, 0)
    const ns5 = rows.slice(0, 5 * ppy).reduce((a, r) => a + r.ns, 0)
    const peak = Math.max(...Array.from({ length: horizon }, (_, y) => yearly((r) => r.ns, y)))
    return { rows, npv, finalVol, firstVol, ns5, peak, withBand }
  }

  const scn = (name: string, gd: number, sm: number): ScenarioRow => {
    const r = run(gd, sm, false)
    const cagr = Math.pow(r.finalVol / r.firstVol, 1 / Math.max(1, horizon - 1)) - 1
    return level === 'sdz'
      ? { name, headline: r.npv, cagr, netSales5y: r.ns5, peak: r.peak, gm }
      : { name, headline: r.finalVol, cagr }
  }
  const base = scn('Base', 0, 1)
  const scenarios = [
    base,
    ...(s.model.upside ? [scn('Upside', 0.015, 1.15)] : []),
    ...(s.model.downside ? [scn('Downside', -0.015, 0.8)] : []),
  ]

  const b = run(0, 1, true)
  const firstHistLabels = [...histPts.keys()]
  const points: Point[] = [
    ...firstHistLabels.map((label, i) => ({ label, t: -(firstHistLabels.length - i) / ppy, hist: histPts.get(label) })),
    ...b.rows.map((r, i) => {
      const w = Z80 * r.sigma
      return {
        label: periodLabel(firstYear, i, ppy),
        t: r.t,
        vol: r.vol,
        p10: mc ? r.vol * (1 - w) : undefined,
        p90: mc ? r.vol * (1 + w) : undefined,
        sdzVol: r.sdzVol,
        netSales: r.ns,
        nsP10: mc ? r.ns * (1 - w * 1.4) : undefined,
        nsP90: mc ? r.ns * (1 + w * 1.4) : undefined,
      }
    }),
  ]

  // Distribution of the headline metric (analytic normal, so no sampling).
  const mu = base.headline
  const sd = mu * (level === 'sdz' ? 0.22 : 0.12)
  const bins: Bin[] = Array.from({ length: 24 }, (_, i) => {
    const lo = mu - 3 * sd + (i * 6 * sd) / 24
    const hi = lo + (6 * sd) / 24
    return { x: (lo + hi) / 2, label: Math.round((lo + hi) / 2).toLocaleString('en-US'), p: cdf((hi - mu) / sd) - cdf((lo - mu) / sd) }
  })

  return {
    level, points, scenarios, base, bins,
    p10: mu - Z80 * sd, p50: mu, p90: mu + Z80 * sd,
    headlineLabel: level === 'sdz' ? `NPV (${currency} M)` : `Final-year market volume (k units)`,
    ccy: currency, ppy,
  }
}
