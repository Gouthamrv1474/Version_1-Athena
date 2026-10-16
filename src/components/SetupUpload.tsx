import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { Modal } from './common'
import { SETUP_TEMPLATE, parseSetup, type SetupData } from '../data/setup'
import { isNewAssumption, useForecast } from '../store/forecast'

const parse = (src: File | string, done: (d: SetupData | null) => void) =>
  // Papa accepts a string at runtime; its typings only list File for the generic overload.
  Papa.parse<Record<string, string>>(src as File, {
    header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase(),
    complete: (r) => done(parseSetup(r.data)),
  })

const download = () => {
  const url = URL.createObjectURL(new Blob([SETUP_TEMPLATE], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), { href: url, download: 'forecast-setup-template.csv' }).click()
  URL.revokeObjectURL(url)
}

/** Drop zone + review dialog. Parsed data is only applied after the user confirms. */
export function SetupUpload({ compact }: { compact?: boolean }) {
  const { assumptions, importSetup, showToast } = useForecast()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ d: SetupData; file: string; demo: boolean } | null>(null)

  const load = (f: File) => {
    setError(null)
    // ponytail: only CSV is really parsed; PDF/Word/Excel load the sample file so the flow can be demoed.
    const csv = /\.csv$/i.test(f.name)
    parse(csv ? f : SETUP_TEMPLATE, (d) =>
      d ? setDraft({ d, file: f.name, demo: !csv })
        : setError('Could not read that file. It needs a header row with at least the columns type and name.'))
  }

  const fresh = draft ? draft.d.assumptions.filter((a) => isNewAssumption(assumptions, a)) : []
  const updated = draft ? draft.d.assumptions.length - fresh.length : 0
  const scope = draft ? [
    draft.d.geos.length && `${draft.d.geos.length} ${draft.d.geos.length === 1 ? 'geography' : 'geographies'}`,
    draft.d.products.length && `${draft.d.products.length} ${draft.d.products.length === 1 ? 'product' : 'products'}`,
    draft.d.granularity && `${draft.d.granularity} granularity`,
    draft.d.channels !== undefined && `channels ${draft.d.channels ? 'on' : 'off'}`,
  ].filter(Boolean).join(', ') : ''

  const apply = () => {
    if (!draft) return
    importSetup(draft.d)
    showToast(`Imported from ${draft.file}: ${fresh.length} new, ${updated} updated.`)
    setDraft(null)
  }

  return (
    <div className="mb-4">
      <input ref={input} type="file" className="sr-only" aria-label="Upload data file" tabIndex={-1}
        accept=".csv,.xlsx,.xls,.pdf,.doc,.docx"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = '' }} />
      <div className="flex gap-2 items-stretch">
        <button type="button" onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) load(f) }}
          className={`flex-1 rounded-md border-2 border-dashed transition-colors text-center ${compact ? 'px-4 py-2.5 flex items-center justify-center gap-3' : 'px-4 py-6'} ${over ? 'border-accent bg-accent-tint' : 'border-[#9db4d3] bg-[#f8fbff] hover:border-accent'}`}>
          <span className="text-[14px] font-semibold block">
            <span aria-hidden className="mr-1.5">⇪</span>Drag &amp; drop your data file, or browse
          </span>
          <span className={`text-[12px] text-muted ${compact ? '' : 'block mt-1'}`}>
            CSV, Excel, PDF or Word. We'll fill in what we find; you review before anything is applied.
          </span>
        </button>
        <button className="btn btn-sm self-center" onClick={download}>Download template</button>
      </div>
      {error && <p role="alert" className="warn text-[13px] mt-2">{error}</p>}

      <Modal open={!!draft} onClose={() => setDraft(null)} title="Review import"
        footer={
          <>
            <button className="btn" onClick={() => setDraft(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={apply}>
              {fresh.length ? `Add ${fresh.length} new and import` : 'Import'}
            </button>
          </>
        }>
        {draft && (
          <div className="space-y-3 text-[13px]">
            <p className="text-muted">From <b className="text-ink">{draft.file}</b>.{draft.demo && ' (Demo: sample values stand in for the extracted content.)'}</p>
            {scope && <p><span className="eyebrow mr-2">Scope</span>{scope}</p>}
            <div>
              <div className="eyebrow mb-1">New parameters, not in your table yet ({fresh.length})</div>
              {fresh.length === 0 ? <p className="text-muted">None. Every parameter in the file is already in your table.</p> : (
                <ul className="max-h-[200px] overflow-y-auto divide-y divide-rule border border-rule rounded">
                  {fresh.map((a) => (
                    <li key={a.name} className="flex items-center gap-3 px-3 py-1.5">
                      <span className="flex-1 font-medium">{a.name}</span>
                      <span className="num">{a.value}</span>
                      <span className="text-[12px] text-muted w-16">{a.unit}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {updated > 0 && <p><span className="eyebrow mr-2">Updated</span>{updated} existing {updated === 1 ? 'parameter' : 'parameters'} will get the file's values.</p>}
            {draft.d.warnings.length > 0 && (
              <details>
                <summary className="cursor-pointer text-warn font-semibold">{draft.d.warnings.length} rows skipped</summary>
                <ul className="list-disc pl-5 mt-1 text-[12px] text-muted">{draft.d.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              </details>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
