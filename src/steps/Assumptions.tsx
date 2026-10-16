import { useState } from 'react'
import { Modal, StepFooter, StepHeader } from '../components/common'
import { SetupUpload } from '../components/SetupUpload'
import { LIBRARY_IDS, PARAMS } from '../data/parameters'
import { definedCount, useForecast } from '../store/forecast'

export function Assumptions() {
  const { assumptions, setAssumption, removeAssumption, addCustom, addAssumptions, fillSample, level, path } = useForecast()
  const defined = useForecast(definedCount)
  const [lib, setLib] = useState(false)
  const [picked, setPicked] = useState<string[]>([])

  const available = LIBRARY_IDS.filter((id) => !assumptions.some((a) => a.id === id))
  const done = assumptions.length > 0 && defined === assumptions.length

  return (
    <div>
      <StepHeader n={3} title="Define assumptions"
        lead={`Provide the key assumptions for your ${path === 'epi' ? 'epidemiology' : 'market'}-based, ${level === 'sdz' ? 'Sandoz-level' : 'market-level'} forecast. The model uses these with the inputs in the next step.`} />

      <SetupUpload compact />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3" aria-live="polite">
          <span className="num text-[13px] font-semibold">{defined} of {assumptions.length} defined</span>
          <span className="h-1.5 w-32 rounded-full bg-tint overflow-hidden">
            <span className="block h-full bg-accent transition-all" style={{ width: `${assumptions.length ? (defined / assumptions.length) * 100 : 0}%` }} />
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={fillSample}>Fill sample values</button>
          <button className="btn btn-sm" onClick={() => { setPicked([]); setLib(true) }}>Add from library</button>
        </div>
      </div>

      {assumptions.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#9db4d3] p-8 text-center text-muted">
          No parameters yet. Add parameters from the library or create your own.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="tbl min-w-[640px]">
            <thead>
              <tr><th className="w-[28%]">Parameter</th><th className="w-[32%]">Value</th><th>Comments</th><th className="w-10"><span className="sr-only">Remove</span></th></tr>
            </thead>
            <tbody>
              {assumptions.map((a) => {
                const custom = a.id.startsWith('custom-')
                return (
                  <tr key={a.id}>
                    <td>
                      {custom ? (
                        <input className="input" aria-label="Parameter name" placeholder="Parameter name" value={a.name} onChange={(e) => setAssumption(a.id, { name: e.target.value })} />
                      ) : (
                        <span className="font-semibold text-[13px] px-1">{a.name}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <input className="input num text-right" aria-label={`${a.name || 'Parameter'} value`} inputMode="decimal" placeholder="0" value={a.value} onChange={(e) => setAssumption(a.id, { value: e.target.value })} />
                        {custom ? (
                          <input className="input w-[84px] shrink-0" aria-label="Unit" placeholder="Unit" value={a.unit} onChange={(e) => setAssumption(a.id, { unit: e.target.value })} />
                        ) : (
                          <span className="text-[11px] text-muted w-[84px] shrink-0 leading-tight">{a.unit}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <input className="input" aria-label={`${a.name || 'Parameter'} comments`} placeholder="Add a note" value={a.comment} onChange={(e) => setAssumption(a.id, { comment: e.target.value })} />
                    </td>
                    <td>
                      <button className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-tint hover:text-bad" aria-label={`Remove ${a.name || 'parameter'}`} onClick={() => removeAssumption(a.id)}>
                        <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M2 2l8 8M10 2l-8 8" /></svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <button className="btn btn-sm mt-3" onClick={addCustom}>+ Add parameter</button>
      {done && <p className="text-[12px] text-accent-ink font-semibold mt-3">All assumptions defined.</p>}

      <StepFooter next={4} />

      <Modal open={lib} onClose={() => setLib(false)} title="Add from library"
        footer={
          <>
            <button className="btn" onClick={() => setLib(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!picked.length} onClick={() => { addAssumptions(picked); setLib(false) }}>
              Add {picked.length || ''} {picked.length === 1 ? 'parameter' : 'parameters'}
            </button>
          </>
        }>
        {available.length === 0 ? (
          <p className="text-muted">Every library parameter is already in your table.</p>
        ) : (
          <ul className="max-h-[320px] overflow-y-auto divide-y divide-rule border border-rule rounded">
            {available.map((id) => (
              <li key={id}>
                <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-tint">
                  <input type="checkbox" className="accent-[var(--accent)]" checked={picked.includes(id)}
                    onChange={() => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))} />
                  <span className="flex-1 font-medium">{PARAMS[id].name}</span>
                  <span className="text-[12px] text-muted">{PARAMS[id].unit}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  )
}
