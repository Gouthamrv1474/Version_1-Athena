import { StepFooter, StepHeader } from '../components/common'
import { SetupUpload } from '../components/SetupUpload'
import { GEOGRAPHIES, PRODUCTS } from '../data/lists'
import { useForecast } from '../store/forecast'
import type { Granularity } from '../store/types'

export function Level() {
  const { level, scope, setScope, path } = useForecast()
  const toggleGeo = (g: string) =>
    setScope({ geos: scope.geos.includes(g) ? scope.geos.filter((x) => x !== g) : [...scope.geos, g] })
  const toggleProduct = (p: string) =>
    setScope({ products: scope.products.includes(p) ? scope.products.filter((x) => x !== p) : [...scope.products, p] })

  return (
    <div>
      <StepHeader n={2} title="Define the scope" lead="Choose the geographies and products to forecast, or upload your data and we'll fill this in for you." />

      <SetupUpload />

      <section aria-labelledby="scope-h">
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
            <fieldset>
              <legend className="lbl">Product <span className="font-normal">(select one or more)</span></legend>
              <div className="grid grid-cols-1 gap-1.5">
                {PRODUCTS.map((p) => {
                  const on = scope.products.includes(p)
                  return (
                    <label key={p} className={`flex items-center gap-2 rounded border px-2.5 py-1.5 cursor-pointer text-[13px] ${on ? 'border-accent bg-accent-tint' : 'border-rule hover:border-[#9db4d3]'}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleProduct(p)} className="accent-[var(--accent)] h-3.5 w-3.5" />
                      {p}
                    </label>
                  )
                })}
              </div>
            </fieldset>
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
        {path === 'epi' ? 'Epidemiology' : 'Market'} <span className="text-muted mx-1">→</span> {level === 'sdz' ? 'Sandoz level' : 'Market level'}
      </div>
      <StepFooter next={3} />
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
