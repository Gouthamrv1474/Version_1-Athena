import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { StepFooter, StepHeader } from '../components/common'
import { compute } from '../mock/engine'
import type { Point } from '../mock/engine'
import { snapshotKey, useForecast } from '../store/forecast'
import { Seg } from './Level'

const STAGES = ['Preparing inputs', 'Building baseline volume', 'Applying drivers and events', 'Running simulation', 'Compiling scenarios']
const AX = { fontSize: 11, fill: '#4a5e78' }
const nf = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="eyebrow">{label}</div>
      <div className="num text-[26px] font-semibold mt-1 leading-none">{value}</div>
      {sub && <div className="text-[12px] text-muted mt-1.5">{sub}</div>}
    </div>
  )
}
const Card = ({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) => (
  <section className="card mt-4">
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-rule">
      <h2 className="font-semibold text-[15px]">{title}</h2>{right}
    </div>
    <div className="p-4">{children}</div>
  </section>
)

type Metric = 'netSales' | 'sdzVol' | 'vol'

export function Output() {
  const s = useForecast()
  const sdz = s.level === 'sdz'
  const [pct, setPct] = useState(0)
  const [metric, setMetric] = useState<Metric>(sdz ? 'netSales' : 'vol')

  useEffect(() => {
    if (s.run !== 'running') return
    const id = setInterval(() => setPct((p) => Math.min(100, p + 4)), 90)
    return () => clearInterval(id)
  }, [s.run])
  const setRun = s.setRun
  useEffect(() => {
    if (s.run === 'running' && pct >= 100) setRun('done', snapshotKey(useForecast.getState()))
  }, [pct, s.run, setRun])

  const key = snapshotKey(s)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const r = useMemo(() => (s.run === 'done' ? compute(useForecast.getState()) : null), [s.run, key])
  const stale = s.run === 'done' && s.ranWith !== key

  const exportToast = (what: string) => s.showToast(`${what} export is a wireframe placeholder. Nothing was downloaded.`)

  return (
    <div>
      <StepHeader n={5} title="Output" lead="Run the forecast to see the results. All figures here are dummy data from a fixed mock model." />

      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-[240px] flex-1">
          {s.run === 'running' ? (
            <div aria-live="polite">
              <div className="text-[13px] font-semibold">{STAGES[Math.min(STAGES.length - 1, Math.floor((pct / 100) * STAGES.length))]}…</div>
              <div className="mt-2 h-2 rounded-full bg-tint overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Forecast progress">
                <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ) : s.run === 'done' ? (
            <div className="text-[13px]"><span className="font-semibold text-accent-ink">Forecast complete.</span> <span className="text-muted">{stale ? 'Inputs changed since this run. Run again to refresh.' : 'Results reflect your current settings.'}</span></div>
          ) : (
            <div className="text-[13px] text-muted">Ready when you are. The run uses {s.model.mc ? `${nf(s.model.sims)} simulations` : 'point estimates'} over {s.model.horizon} years.</div>
          )}
        </div>
        <button className="btn btn-primary" disabled={s.run === 'running'} onClick={() => { setPct(0); s.setRun('running') }}>
          {s.run === 'done' ? 'Run again' : 'Run forecast'}
        </button>
      </div>
      {stale && <p className="warn mt-3" role="status">The results below are out of date.</p>}

      {!r && s.run === 'idle' && (
        <div className="mt-4 rounded-md border border-dashed border-[#9db4d3] p-10 text-center text-muted">
          No results yet. Choose Run forecast to generate them.
        </div>
      )}

      {r && (
        <div className="rise">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
            {sdz ? (
              <>
                <Kpi label="NPV" value={nf(r.base.headline, 1)} sub={`${r.ccy} M · P10–P90 ${nf(r.p10, 0)} to ${nf(r.p90, 0)}`} />
                <Kpi label="Peak net sales" value={nf(r.base.peak ?? 0, 1)} sub={`${r.ccy} M per year`} />
                <Kpi label="5-year net sales" value={nf(r.base.netSales5y ?? 0, 1)} sub={`${r.ccy} M cumulative`} />
                <Kpi label="Gross margin" value={`${nf((r.base.gm ?? 0) * 100, 1)}%`} sub="After TPC / COGS" />
              </>
            ) : (
              <>
                <Kpi label="Final-year volume" value={nf(r.base.headline)} sub={`k units · P10–P90 ${nf(r.p10)} to ${nf(r.p90)}`} />
                <Kpi label="Volume CAGR" value={`${nf(r.base.cagr * 100, 1)}%`} sub="Across the horizon" />
                <Kpi label="Horizon" value={`${s.model.horizon} yrs`} sub={`From ${s.model.firstYear}`} />
                <Kpi label="History used" value={s.inputs.history ? `${s.inputs.history.length} mo` : 'None'} sub={s.inputs.history ? 'Anchors the baseline' : 'Based on assumptions'} />
              </>
            )}
          </div>

          <Card
            title={sdz ? { netSales: `Net sales (${r.ccy} M)`, sdzVol: 'Sandoz volume (k units)', vol: 'Market volume (k units)' }[metric] : 'Market volume (k units)'}
            right={sdz && <Seg options={['Net sales', 'Sandoz volume', 'Market volume']} value={{ netSales: 'Net sales', sdzVol: 'Sandoz volume', vol: 'Market volume' }[metric]} onChange={(v) => setMetric(v === 'Net sales' ? 'netSales' : v === 'Sandoz volume' ? 'sdzVol' : 'vol')} />}
          >
            <ForecastChart points={r.points} metric={sdz ? metric : 'vol'} mc={s.model.mc} />
          </Card>

          <Card title="Scenarios">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Scenario</th>
                  {sdz ? <><th className="text-right">NPV ({r.ccy} M)</th><th className="text-right">Peak ({r.ccy} M)</th><th className="text-right">5-yr sales ({r.ccy} M)</th><th className="text-right">Gross margin</th></> : <><th className="text-right">Final-year volume (k)</th></>}
                  <th className="text-right">Volume CAGR</th>
                </tr>
              </thead>
              <tbody>
                {r.scenarios.map((x) => (
                  <tr key={x.name}>
                    <td className="font-semibold px-2 py-2.5">{x.name}</td>
                    {sdz ? <><td className="num text-right">{nf(x.headline, 1)}</td><td className="num text-right">{nf(x.peak ?? 0, 1)}</td><td className="num text-right">{nf(x.netSales5y ?? 0, 1)}</td><td className="num text-right">{nf((x.gm ?? 0) * 100, 1)}%</td></> : <td className="num text-right">{nf(x.headline)}</td>}
                    <td className="num text-right">{nf(x.cagr * 100, 1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title={`Distribution · ${r.headlineLabel}`}>
            {s.model.mc ? (
              <>
                <div className="h-[230px]" role="img" aria-label="Histogram of simulated outcomes with P10, P50 and P90 marked">
                  <ResponsiveContainer>
                    <BarChart data={r.bins} margin={{ left: 0, right: 8, top: 16 }} barCategoryGap={1}>
                      <CartesianGrid stroke="#d5e0ee" vertical={false} />
                      <XAxis dataKey="label" tick={AX} interval={3} />
                      <YAxis tick={AX} width={48} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
                      <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} labelFormatter={(l) => `Around ${l}`} />
                      {[['P10', r.p10], ['P50', r.p50], ['P90', r.p90]].map(([n, v]) => (
                        <ReferenceLine key={n as string} x={nearest(r.bins, v as number)} stroke="#0a2a5e" strokeDasharray="4 3" label={{ value: n as string, position: 'top', fontSize: 11, fill: '#0a2a5e' }} />
                      ))}
                      <Bar dataKey="p" name="Probability" fill="var(--accent)" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[12px] text-muted mt-2">Based on {nf(s.model.sims)} simulated runs. P10 <span className="num">{nf(r.p10, 0)}</span> · P50 <span className="num">{nf(r.p50, 0)}</span> · P90 <span className="num">{nf(r.p90, 0)}</span>.</p>
              </>
            ) : (
              <p className="text-muted text-[13px]">Monte Carlo is off, so there is no distribution.</p>
            )}
          </Card>

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="eyebrow mr-2">Export</span>
            {['CSV', 'Excel', 'PDF', 'PowerPoint'].map((x) => <button key={x} className="btn btn-sm" onClick={() => exportToast(x)}>{x}</button>)}
          </div>
        </div>
      )}
      <StepFooter />
    </div>
  )
}

const nearest = (bins: { x: number; label: string }[], v: number) =>
  bins.reduce((a, b) => (Math.abs(b.x - v) < Math.abs(a.x - v) ? b : a)).label

function ForecastChart({ points, metric, mc }: { points: Point[]; metric: Metric; mc: boolean }) {
  const data = useMemo(() => points.filter((p) => metric === 'vol' || p.hist === undefined).map((p) => {
    const v = p[metric]
    const rel = p.vol && p.p10 && p.p90 ? (p.p90 - p.vol) / p.vol : 0
    const lo = !mc || v === undefined ? undefined : metric === 'vol' ? p.p10 : v * (1 - rel * 1.4)
    const hi = !mc || v === undefined ? undefined : metric === 'vol' ? p.p90 : v * (1 + rel * 1.4)
    return { label: p.label, hist: p.hist, v, lo, span: lo !== undefined && hi !== undefined ? hi - lo : undefined }
  }), [points, metric, mc])
  // One tick per year, at the first period of each year.
  const ticks = data.filter((d) => /^(Jan \d\d|\d{4} Q1|\d{4})$/.test(d.label)).map((d) => d.label)
  const hasHist = metric === 'vol' && points.some((p) => p.hist !== undefined)
  return (
    <div className="h-[320px]" role="img" aria-label="Forecast chart with P10 to P90 band">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ left: 0, right: 8, top: 4 }}>
          <CartesianGrid stroke="#d5e0ee" vertical={false} />
          <XAxis dataKey="label" tick={AX} ticks={ticks} tickFormatter={(l: string) => (/^[A-Z][a-z]{2} \d\d$/.test(l) ? `20${l.slice(4)}` : l.slice(0, 4))} />
          <YAxis tick={AX} width={52} tickFormatter={(v) => nf(v)} />
          <Tooltip formatter={(v, n) => [nf(Number(v), 1), n === 'span' ? 'P10–P90 width' : String(n)]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {mc && <Area dataKey="lo" stackId="b" stroke="none" fill="transparent" legendType="none" isAnimationActive={false} name="P10" />}
          {mc && <Area dataKey="span" stackId="b" stroke="none" fill="#cfdcf3" name="P10–P90" isAnimationActive={false} />}
          {hasHist && <Line dataKey="hist" name="History" stroke="#4a5e78" strokeWidth={2} dot={false} isAnimationActive={false} />}
          <Line dataKey="v" name="Forecast (base)" stroke="var(--accent)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
