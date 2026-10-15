import { useRef, useState, type ReactNode } from 'react'
import Papa from 'papaparse'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StepFooter, StepHeader, Switch } from '../components/common'
import { ANALOGUES } from '../data/lists'
import { SAMPLE_CSV, SAMPLE_HISTORY } from '../data/history'
import { channelTotal, historyRequired, skuTotal, useForecast } from '../store/forecast'
import type { HistoryRow, ModuleKey } from '../store/types'

function Section({ title, badge, module, desc, children }: { title: string; badge?: ReactNode; module?: ModuleKey; desc?: string; children: ReactNode }) {
  const on = useForecast((s) => (module ? s.modules[module] : true))
  const setModule = useForecast((s) => s.setModule)
  return (
    <section className="card mb-4">
      <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-rule">
        <div>
          <h2 className="font-semibold text-[15px] flex items-center gap-2">{title} {badge}</h2>
          {desc && <p className="text-muted text-[12px] mt-0.5 max-w-[60ch]">{desc}</p>}
        </div>
        {module && (
          <label className="flex items-center gap-2 text-[12px] text-muted shrink-0">
            {on ? 'On' : 'Off'}
            <Switch on={on} onChange={(v) => setModule(module, v)} label={`${title} module`} />
          </label>
        )}
      </div>
      {on ? <div className="p-4">{children}</div> : <p className="px-4 py-3 text-[13px] text-muted">Module off. The model ignores these inputs.</p>}
    </section>
  )
}

const Pill = ({ children, tone }: { children: ReactNode; tone: 'req' | 'opt' }) => (
  <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${tone === 'req' ? 'bg-accent-tint text-accent-ink' : 'bg-tint text-muted'}`}>{children}</span>
)

function Num({ value, onChange, label, suffix, min = 0, max }: { value: number; onChange: (n: number) => void; label: string; suffix?: string; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <input type="number" className="input num text-right" aria-label={label} value={value} min={min} max={max}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
      {suffix && <span className="text-[11px] text-muted whitespace-nowrap">{suffix}</span>}
    </div>
  )
}

function History() {
  const { inputs, setInputs } = useForecast()
  const required = useForecast(historyRequired)
  const file = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = (f: File) => {
    Papa.parse<Record<string, string>>(f, {
      header: true, skipEmptyLines: true,
      complete: (r) => {
        const rows: HistoryRow[] = r.data.map((d) => ({ period: (d.period ?? '').trim(), volume: Number(d.volume) }))
        if (!rows.length || rows.some((x) => !/^\d{4}-\d{2}$/.test(x.period) || !Number.isFinite(x.volume))) {
          setErr('Could not read that file. Use two columns, period (YYYY-MM) and volume, with a header row.')
          return
        }
        setErr(null)
        setInputs({ history: rows, historyName: f.name })
      },
    })
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: 'text/csv' }))
    Object.assign(document.createElement('a'), { href: url, download: 'originator-volume-sample.csv' }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <Section title="Historical originator volume" badge={<Pill tone={required ? 'req' : 'opt'}>{required ? 'Required' : 'Optional'}</Pill>}
      desc="Monthly originator volume in thousand units. Upload a CSV with period and volume columns.">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Upload CSV"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = '' }} />
        <button className="btn btn-sm" onClick={() => file.current?.click()}>Upload CSV</button>
        <button className="btn btn-sm" onClick={() => { setErr(null); setInputs({ history: SAMPLE_HISTORY, historyName: 'originator-volume-sample.csv' }) }}>Use sample data</button>
        <button className="btn btn-sm" onClick={download}>Download sample file</button>
        {inputs.history && <button className="btn btn-sm" onClick={() => setInputs({ history: null, historyName: null })}>Remove</button>}
      </div>
      {err && <p className="warn mt-3" role="alert">{err}</p>}
      {inputs.history ? (
        <div className="mt-4">
          <p className="text-[12px] text-muted mb-2"><span className="font-semibold text-ink">{inputs.historyName}</span> · <span className="num">{inputs.history.length}</span> periods, {inputs.history[0].period} to {inputs.history[inputs.history.length - 1].period}</p>
          <div className="h-[200px]" role="img" aria-label="Line chart of historical originator volume">
            <ResponsiveContainer>
              <LineChart data={inputs.history} margin={{ left: 0, right: 8, top: 4 }}>
                <CartesianGrid stroke="#d5e0ee" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#4a5e78' }} interval={5} />
                <YAxis tick={{ fontSize: 11, fill: '#4a5e78' }} width={44} domain={['auto', 'auto']} />
                <Tooltip />
                <Line dataKey="volume" name="Volume (k units)" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-muted">{required ? 'Upload history to continue. The Market path needs it to anchor the baseline.' : 'No history yet. Without it, the model starts from the assumptions in step 3.'}</p>
      )}
    </Section>
  )
}

export function Inputs() {
  const s = useForecast()
  const { inputs, setInputs } = s
  const sdz = s.level === 'sdz'
  const ch = channelTotal(s)
  const sku = skuTotal(s)
  const net = inputs.price.list * (1 - inputs.price.discount / 100) * (1 - inputs.price.g2n / 100)
  const upd = <K extends keyof typeof inputs>(k: K, v: (typeof inputs)[K]) => setInputs({ [k]: v } as Partial<typeof inputs>)

  return (
    <div>
      <StepHeader n={4} title="Inputs" lead="Add the data and drivers behind your assumptions. Switch an add-on module off to leave its inputs out of the model." />

      <History />

      {s.path === 'epi' && (
        <Section title="Epidemiology module" module="epi" desc="Projects originator volume from the patient-level assumptions in step 3.">
          <p className="text-[13px] text-muted">No extra inputs. The model uses your six epidemiology assumptions to build the baseline.</p>
        </Section>
      )}

      <Section title="Market events" module="events" desc="Events that shift the baseline. Expected effect is impact × likelihood.">
        <table className="tbl">
          <thead><tr><th>Event</th><th className="w-32">Impact</th><th className="w-32">Likelihood</th><th className="w-10"><span className="sr-only">Remove</span></th></tr></thead>
          <tbody>
            {inputs.events.map((e, i) => (
              <tr key={e.id}>
                <td><input className="input" aria-label="Event name" placeholder="Event name" value={e.name} onChange={(ev) => upd('events', inputs.events.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)))} /></td>
                <td><Num value={e.impact} min={-100} max={100} label="Impact" suffix="%" onChange={(n) => upd('events', inputs.events.map((x, j) => (j === i ? { ...x, impact: n } : x)))} /></td>
                <td><Num value={e.likelihood} max={100} label="Likelihood" suffix="%" onChange={(n) => upd('events', inputs.events.map((x, j) => (j === i ? { ...x, likelihood: n } : x)))} /></td>
                <td><button className="h-7 w-7 rounded text-muted hover:bg-tint hover:text-bad" aria-label="Remove event" onClick={() => upd('events', inputs.events.filter((_, j) => j !== i))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {inputs.events.length === 0 && <p className="text-[13px] text-muted py-2">No events. Add one to test its effect on the baseline.</p>}
        <button className="btn btn-sm mt-3" onClick={() => upd('events', [...inputs.events, { id: `ev${Date.now()}`, name: '', impact: 0, likelihood: 50 }])}>+ Add event</button>
      </Section>

      {s.scope.channels && (
        <Section title="Channel split" module="segments" desc="Share of volume by channel. The total must equal 100%.">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(inputs.channelSplit).map(([c, v]) => (
              <div key={c} className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium">{c}</span>
                <div className="w-32"><Num value={v} max={100} label={`${c} share`} suffix="%" onChange={(n) => upd('channelSplit', { ...inputs.channelSplit, [c]: n })} /></div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[13px]">
            <span className="font-semibold">Total <span className="num">{ch}%</span></span>
            {ch !== 100 && <span className="warn" role="alert">Total is {ch}%, {ch > 100 ? 'over' : 'under'} by {Math.abs(100 - ch)}%. Adjust the split to reach 100%.</span>}
          </div>
        </Section>
      )}

      <Section title="Launch and market formation risks" desc="Likelihood and expected delay for each risk. Delay pushes the launch date back.">
        <table className="tbl">
          <thead><tr><th>Risk</th><th className="w-32">Likelihood</th><th className="w-36">Delay if it occurs</th></tr></thead>
          <tbody>
            {inputs.risks.map((r, i) => (
              <tr key={r.id}>
                <td className="font-medium text-[13px] px-2">{r.name}</td>
                <td><Num value={r.likelihood} max={100} label={`${r.name} likelihood`} suffix="%" onChange={(n) => upd('risks', inputs.risks.map((x, j) => (j === i ? { ...x, likelihood: n } : x)))} /></td>
                <td><Num value={r.delayMonths} label={`${r.name} delay`} suffix="months" onChange={(n) => upd('risks', inputs.risks.map((x, j) => (j === i ? { ...x, delayMonths: n } : x)))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {sdz && (
        <>
          <Section title="Competition and order of entry" desc="Later entry and more competitors reduce Sandoz share.">
            <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
              <div><span className="lbl">Expected competitors at launch</span><Num value={inputs.competitors} label="Competitors" onChange={(n) => upd('competitors', n)} /></div>
              <div><span className="lbl">Sandoz order of entry</span><Num value={inputs.entryOrder} min={1} label="Order of entry" onChange={(n) => upd('entryOrder', n)} /></div>
            </div>
          </Section>

          <Section title="Analogue set" desc="Past launches used to anchor Gx/Bio penetration and Sandoz share.">
            <ul className="divide-y divide-rule border border-rule rounded">
              {ANALOGUES.map((a) => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-tint">
                    <input type="checkbox" className="accent-[var(--accent)]" checked={inputs.analogues.includes(a.id)}
                      onChange={() => upd('analogues', inputs.analogues.includes(a.id) ? inputs.analogues.filter((x) => x !== a.id) : [...inputs.analogues, a.id])} />
                    <span className="flex-1 text-[13px] font-medium">{a.name}</span>
                    <span className="text-[12px] text-muted num">peak share {a.peakShare}% · {a.years} yrs</span>
                  </label>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Price and cost" desc="Sets net price and gross margin per unit.">
            <div className="grid sm:grid-cols-4 gap-4">
              <div><span className="lbl">List price (USD / unit)</span><Num value={inputs.price.list} label="List price" onChange={(n) => upd('price', { ...inputs.price, list: n })} /></div>
              <div><span className="lbl">Discount vs originator</span><Num value={inputs.price.discount} max={100} label="Discount" suffix="%" onChange={(n) => upd('price', { ...inputs.price, discount: n })} /></div>
              <div><span className="lbl">Gross-to-net</span><Num value={inputs.price.g2n} max={100} label="Gross-to-net" suffix="%" onChange={(n) => upd('price', { ...inputs.price, g2n: n })} /></div>
              <div><span className="lbl">TPC / COGS (USD / unit)</span><Num value={inputs.price.cogs} label="TPC or COGS" onChange={(n) => upd('price', { ...inputs.price, cogs: n })} /></div>
            </div>
            <p className="mt-3 text-[13px] text-muted">Net price <span className="num font-semibold text-ink">{net.toFixed(2)}</span> USD / unit · gross margin <span className="num font-semibold text-ink">{net > 0 ? Math.max(0, ((net - inputs.price.cogs) / net) * 100).toFixed(1) : '0.0'}%</span></p>
          </Section>

          <Section title="SKU mix" module="sku" desc="Share of volume by pack. Weights the average net price.">
            <div className="grid sm:grid-cols-3 gap-4">
              {inputs.skuMix.map((k, i) => (
                <div key={k.sku}><span className="lbl">{k.sku}</span><Num value={k.share} max={100} label={`${k.sku} share`} suffix="%" onChange={(n) => upd('skuMix', inputs.skuMix.map((x, j) => (j === i ? { ...x, share: n } : x)))} /></div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[13px]">
              <span className="font-semibold">Total <span className="num">{sku}%</span></span>
              {sku !== 100 && <span className="warn" role="alert">Total is {sku}%. Adjust the mix to reach 100%.</span>}
            </div>
          </Section>
        </>
      )}

      <StepFooter next={5} nextLabel="Continue to output" />
    </div>
  )
}
