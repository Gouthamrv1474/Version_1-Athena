import { useEffect, useRef, type ReactNode } from 'react'
import { STEPS, lockReason, useForecast } from '../store/forecast'

export function StepHeader({ n, title, lead }: { n: number; title: string; lead: string }) {
  return (
    <header className="mb-5">
      <div className="eyebrow">Step {n} of 5</div>
      <h1 className="title text-[30px] leading-tight mt-1">{title}</h1>
      <p className="text-muted mt-1 max-w-[62ch] text-[14px]">{lead}</p>
    </header>
  )
}

export function StepFooter({ next, nextLabel = 'Continue', nextDisabled }: { next?: number; nextLabel?: string; nextDisabled?: boolean }) {
  const step = useForecast((s) => s.step)
  const go = useForecast((s) => s.go)
  const locked = useForecast((s) => (next ? lockReason(s, next) : null))
  return (
    <footer className="flex items-center justify-between mt-6 pt-4 border-t border-rule">
      {step > 1 ? (
        <button className="btn" onClick={() => go(step - 1)}>Back</button>
      ) : <span />}
      {next && (
        <div className="flex items-center gap-3">
          {locked && <span className="text-[12px] text-muted">{locked}</span>}
          <button className="btn btn-primary" disabled={!!locked || nextDisabled} onClick={() => go(next)}>
            {nextLabel}
          </button>
        </div>
      )}
    </footer>
  )
}

export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${on ? 'bg-accent border-accent' : 'bg-white border-[#9db4d3]'}`}
    >
      <span className={`absolute top-[2px] h-3.5 w-3.5 rounded-full transition-all ${on ? 'left-[18px] bg-white' : 'left-[2px] bg-[#6b84a6]'}`} />
    </button>
  )
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} className="m-auto w-[520px]">
      {open && (
        <div>
          <div className="px-5 pt-4 pb-2"><h2 className="title text-[22px]">{title}</h2></div>
          <div className="px-5 pb-4">{children}</div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-rule bg-[#f8fbff]">{footer}</div>
        </div>
      )}
    </dialog>
  )
}

export function Toast() {
  const msg = useForecast((s) => s.toast)
  const show = useForecast((s) => s.showToast)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => show(null), 3600)
    return () => clearTimeout(t)
  }, [msg, show])
  if (!msg) return null
  return (
    <div role="status" className="rise fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-navy text-white text-[13px] px-4 py-2.5 rounded-md shadow-lg max-w-[90vw]">
      {msg}
    </div>
  )
}

export function Rail() {
  const s = useForecast()
  return (
    <nav aria-label="Forecast steps" className="lg:sticky lg:top-4">
      <ol className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
        {STEPS.map((st) => {
          const reason = lockReason(s, st.n)
          const current = s.step === st.n
          const done = !reason && !current && stepDone(s, st.n)
          return (
            <li key={st.n} className="shrink-0">
              <button
                aria-current={current ? 'step' : undefined}
                aria-disabled={!!reason}
                title={reason ?? undefined}
                onClick={() => !reason && s.go(st.n)}
                className={`group w-full text-left flex items-start gap-3 rounded-md px-2.5 py-2 transition-colors ${reason ? 'cursor-not-allowed opacity-60' : 'hover:bg-tint cursor-pointer'} ${current ? 'bg-accent-tint' : ''}`}
              >
                <span className={`num mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${current ? 'bg-accent border-accent text-white' : done ? 'bg-accent-tint border-accent text-accent-ink' : 'bg-white border-[#9db4d3] text-muted'}`}>
                  {reason ? <LockIcon /> : done ? '✓' : st.n}
                </span>
                <span>
                  <span className={`block text-[13px] font-semibold ${current ? 'text-accent-ink' : ''}`}>{st.name}</span>
                  <span className="hidden lg:block text-[12px] text-muted leading-snug">{reason ?? st.short}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

import { isComplete } from '../store/forecast'
import type { State } from '../store/forecast'
const stepDone = (s: State, n: number) => isComplete(s, n)

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <rect x="2" y="5.5" width="8" height="5" rx="1" /><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" />
  </svg>
)

/** Shows the flow so far: Start › path › level › each later step reached. */
export function Breadcrumbs() {
  const { step, path, level, go } = useForecast()
  const crumbs: { label: string; to: number }[] = [{ label: 'Start', to: 1 }]
  if (step >= 2) {
    if (path) crumbs.push({ label: path === 'epi' ? 'Epidemiology' : 'Market', to: 1 })
    crumbs.push({ label: level ? (level === 'sdz' ? 'Sandoz level' : 'Market level') : 'Forecast level', to: 2 })
    for (const st of STEPS.slice(2, step)) crumbs.push({ label: st.name, to: st.n })
  }
  return (
    <nav aria-label="Breadcrumb" className="bg-white border-b border-rule">
      <ol className="mx-auto max-w-[1440px] px-4 h-10 flex items-center gap-2 text-[13px] overflow-x-auto whitespace-nowrap">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-[#9db4d3]">›</span>}
              {last ? (
                <span aria-current="page" className="font-semibold text-accent-ink">{c.label}</span>
              ) : (
                <button onClick={() => go(c.to)} className="text-muted hover:text-accent-ink hover:underline">{c.label}</button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
