import { StepFooter, StepHeader } from '../components/common'
import { useResetGuard } from '../components/useReset'
import { useForecast } from '../store/forecast'

const LEVELS = [
  { id: 'market' as const, name: 'Market level', body: 'Forecast the total market, such as size and segments, across the selected geography.' },
  { id: 'sdz' as const, name: 'Sandoz level', body: 'Forecast Sandoz share and products within the Sandoz portfolio, through to net sales and NPV.' },
]

const OPTIONS = [
  {
    id: 'epi' as const,
    name: 'Epidemiology',
    tag: 'Epi',
    body: 'Start from patient-level inputs: population, incidence, prevalence, diagnosis and treatment rates.',
    icon: (
      <svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="14" cy="13" r="5" /><path d="M5 31c0-5 4-9 9-9s9 4 9 9" />
        <circle cx="29" cy="15" r="4" /><path d="M26 25c4-1 9 2 9 7" />
      </svg>
    ),
  },
  {
    id: 'market' as const,
    name: 'Market',
    tag: 'Market',
    body: 'Start from overall market inputs: market size, growth, segmentation, Sandoz share and price.',
    icon: (
      <svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 32V18M15 32V10M24 32V22M33 32V14" /><path d="M4 34h32" />
      </svg>
    ),
  },
]

export function Start() {
  const path = useForecast((s) => s.path)
  const setPath = useForecast((s) => s.setPath)
  const level = useForecast((s) => s.level)
  const setLevel = useForecast((s) => s.setLevel)
  const { request, dialog } = useResetGuard()

  return (
    <div>
      <StepHeader n={1} title="Where would you like to start?" lead="Pick the input you trust most, then the forecast level. Together they set the parameters you'll fill in." />
      <div role="radiogroup" aria-label="Starting point" className="grid sm:grid-cols-2 gap-4">
        {OPTIONS.map((o) => {
          const on = path === o.id
          return (
            <button
              key={o.id} role="radio" aria-checked={on}
              onClick={() => o.id !== path && request(() => setPath(o.id))}
              className={`text-left rounded-md border-2 p-5 transition-colors ${on ? 'border-accent bg-accent-tint' : 'border-rule bg-white hover:border-[#9db4d3]'}`}
            >
              <div className="flex items-start justify-between">
                <span className={on ? 'text-accent' : 'text-muted'}>{o.icon}</span>
                <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${on ? 'border-accent' : 'border-[#9db4d3]'}`}>
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                </span>
              </div>
              <div className="title text-[22px] mt-4">{o.name}</div>
              <p className="text-muted mt-1 text-[13px]">{o.body}</p>
            </button>
          )
        })}
      </div>
      {path && (
        <section className="mt-6 rise" aria-labelledby="level-h">
          <h2 id="level-h" className="eyebrow mb-3">Forecast level</h2>
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
        </section>
      )}
      <StepFooter next={2} />
      {dialog}
    </div>
  )
}
