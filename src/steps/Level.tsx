import { StepFooter, StepHeader } from '../components/common'
import { useResetGuard } from '../components/useReset'
import { GEOGRAPHIES, PRODUCTS } from '../data/lists'
import { useForecast } from '../store/forecast'
import type { Granularity } from '../store/types'

const LEVELS = [
  { id: 'market' as const, name: 'Market level', body: 'Forecast the total market, such as size and segments, across the selected geography.' },
  { id: 'sdz' as const, name: 'Sandoz level', body: 'Forecast Sandoz share and products within the Sandoz portfolio, through to net sales and NPV.' },
]

export function Level() {
  const { level, setLevel, scope, setScope, path } = useForecast()
  const { request, dialog } = useResetGuard()
  const toggleGeo = (g: string) =>
    setScope({ geos: scope.geos.includes(g) ? scope.geos.filter((x) => x !== g) : [...scope.geos, g] })

  return (
    <div>
      <StepHeader n={2} title="What level would you like to forecast?" lead="Pick the forecast level, then set the scope. Sandoz level adds penetration, price and launch inputs." />

      <div role="radiogroup" aria-label="Forecast level" className="grid sm:grid-cols-2 gap-4">
        {LEVELS.map((l) => {
          const on = level === l.id
          return (
            <button key={l.id} role="radio" aria-checked={on}
              onClick={() => l.id !== level && request(() => setLevel(l.id))}
              className={`text-left rounded-md border-2 p-4 transition-colors ${on ? 'border-accent bg-accent-tint' : 'border-rule bg-white hover:border-[#9db4d3]'}`}>
              <div className="flex justify-between items-center">
                <span className="title text-[20px]">{l.name}</span>
                <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${on ? 'border-accent' : 'border-[#9db4d3]'}`}>
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                </span>
              </div>
              <p className="text-muted mt-1 text-[13px]">{l.body}</p>
            </button>
          )
        })}
      </div>

      <section className="mt-6" aria-labelledby="scope-h">
        <h2 id="scope-h" className="eyebrow mb-3">Scope</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <fieldset>
            <legend className="lbl">Geography <span className="font-normal">(select one or more)</span></legend>
            <div className="grid grid-cols-2 gap-1.5">
              {GEOGRAPHIES.map((g) => {
                const on = scope.geos.includes(g)
                return (
                  <label key={g} className={`flex items-center gap-2 rounded border px-2.5 py-1.5 cursor-pointer text-[13px] ${on ? 'border-accent bg-accent-tint' : 'border-rule hover:border-[#9db4d3]'}`}>
                    <input type="checkbox" checked={on} onChange={() => toggleGeo(g)} className="accent-[var(--accent)] h-3.5 w-3.5" />
                    {g}
                  </label>
                )
              })}
            </div>
            {scope.geos.length === 0 && <p className="text-[12px] text-muted mt-1.5">Select at least one geography to run the forecast.</p>}
          </fieldset>

          <div className="space-y-4">
            <div>
              <label className="lbl" htmlFor="product">Product</label>
              <select id="product" className="input" value={scope.product ?? ''} onChange={(e) => setScope({ product: e.target.value || null })}>
                <option value="">Select product</option>
                {PRODUCTS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <fieldset>
              <legend className="lbl">Time granularity</legend>
              <Seg options={['Monthly', 'Quarterly', 'Annual']} value={scope.granularity} onChange={(v) => setScope({ granularity: v as Granularity })} />
            </fieldset>
            <fieldset>
              <legend className="lbl">Channel granularity</legend>
              <Seg options={['No', 'Yes']} value={scope.channels ? 'Yes' : 'No'} onChange={(v) => setScope({ channels: v === 'Yes' })} />
              <p className="text-[12px] text-muted mt-1.5">Yes adds a channel split in step 4.</p>
            </fieldset>
          </div>
        </div>
      </section>

      <div className="mt-5 rounded border border-rule bg-[#f8fbff] px-3 py-2 text-[13px]">
        <span className="eyebrow mr-3">Selected path</span>
        {path === 'epi' ? 'Epidemiology' : 'Market'} <span className="text-muted mx-1">→</span> {level ? (level === 'market' ? 'Market level' : 'Sandoz level') : <span className="text-muted">Choose a level</span>}
      </div>
      <StepFooter next={3} />
      {dialog}
    </div>
  )
}

export function Seg({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" className="inline-flex rounded-md border border-rule overflow-hidden">
      {options.map((o) => (
        <button key={o} role="radio" aria-checked={o === value} onClick={() => onChange(o)}
          className={`px-3.5 h-8 text-[13px] font-semibold border-r border-rule last:border-0 ${o === value ? 'bg-accent text-white' : 'bg-white hover:bg-tint'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}
