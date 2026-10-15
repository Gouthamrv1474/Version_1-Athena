import type { ReactNode } from 'react'
import { channelTotal, definedCount, historyRequired, skuTotal, useForecast } from '../store/forecast'

function Row({ k, children, dim }: { k: string; children: ReactNode; dim?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-rule last:border-0">
      <dt className="text-muted text-[12px] shrink-0">{k}</dt>
      <dd className={`text-[13px] text-right font-medium ${dim ? 'text-muted font-normal' : ''}`}>{children}</dd>
    </div>
  )
}
const NOT_SET = <span className="text-muted font-normal">Not set</span>

export function SummaryPanel() {
  const s = useForecast()
  const total = s.assumptions.length
  const defined = definedCount(s)
  const ch = channelTotal(s)
  const modulesOn = Object.entries(s.modules).filter(([, v]) => v).map(([k]) => ({ epi: 'Epi', events: 'Events', segments: 'Segments', sku: 'SKU mix' })[k as 'epi'])
  const ready = !!s.level && s.scope.geos.length > 0 && !!s.scope.product

  return (
    <aside aria-label="Forecast summary" className="lg:sticky lg:top-4 card p-4">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Forecast summary</h2>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ready ? 'bg-accent-tint text-accent-ink' : 'bg-tint text-muted'}`}>
          {ready ? 'Ready to run' : 'In progress'}
        </span>
      </div>
      <dl className="mt-2">
        <Row k="Start from">{s.path ? (s.path === 'epi' ? 'Epidemiology' : 'Market') : NOT_SET}</Row>
        <Row k="Forecast level">{s.level ? (s.level === 'market' ? 'Market level' : 'Sandoz level') : NOT_SET}</Row>
        <Row k="Geography">
          {s.scope.geos.length ? (s.scope.geos.length > 2 ? `${s.scope.geos.length} selected` : s.scope.geos.join(', ')) : NOT_SET}
        </Row>
        <Row k="Product">{s.scope.product ?? NOT_SET}</Row>
        <Row k="Time granularity">{s.scope.granularity}</Row>
        <Row k="Channel granularity">{s.scope.channels ? 'Yes' : 'No'}</Row>
      </dl>

      <div className="mt-4 pt-3 border-t border-rule">
        <h3 className="eyebrow">Progress</h3>
        <dl className="mt-1">
          <Row k="Assumptions">
            <span className="num">{defined} of {total}</span> defined
          </Row>
          <Row k="Historical volume">
            {s.inputs.history ? `${s.inputs.history.length} periods` : historyRequired(s) ? <span className="text-warn">Required</span> : <span className="text-muted font-normal">Optional</span>}
          </Row>
          {s.scope.channels && (
            <Row k="Channel split">
              <span className={`num ${ch !== 100 ? 'text-warn' : ''}`}>{ch}%</span>
            </Row>
          )}
          {s.level === 'sdz' && s.modules.sku && (
            <Row k="SKU mix"><span className={`num ${skuTotal(s) !== 100 ? 'text-warn' : ''}`}>{skuTotal(s)}%</span></Row>
          )}
          <Row k="Add-ons on">{modulesOn.length ? modulesOn.join(', ') : 'None'}</Row>
        </dl>
      </div>
    </aside>
  )
}
