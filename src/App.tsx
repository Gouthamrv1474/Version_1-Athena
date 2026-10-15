import { useEffect } from 'react'
import { Breadcrumbs, Rail, Toast } from './components/common'
import { SummaryPanel } from './components/SummaryPanel'
import { useForecast } from './store/forecast'
import { Start } from './steps/Start'
import { Level } from './steps/Level'
import { Assumptions } from './steps/Assumptions'
import { Inputs } from './steps/Inputs'
import { Output } from './steps/Output'

const PAGES = [Start, Level, Assumptions, Inputs, Output]

export default function App() {
  const step = useForecast((s) => s.step)
  const path = useForecast((s) => s.path)
  const Page = PAGES[step - 1]

  useEffect(() => {
    document.documentElement.dataset.path = path ?? ''
    window.scrollTo(0, 0)
  }, [path, step])

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-navy text-white">
        <div className="mx-auto max-w-[1440px] px-4 h-12 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-bold tracking-[0.22em] text-[15px]">ATHENA</span>
            <span className="text-[12px] text-[#b9cdee] hidden sm:inline">Pharma forecasting platform</span>
          </div>
          <span className="text-[11px] font-semibold tracking-wide uppercase border border-[#6f8fc8] text-[#dbe7ff] rounded-full px-3 py-1">
            Wireframe · dummy data
          </span>
        </div>
      </header>
      <Breadcrumbs />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-5 grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)_300px] items-start">
        <Rail />
        <main className="card p-6 min-w-0 rise" key={step}>
          <Page />
        </main>
        <SummaryPanel />
      </div>
      <Toast />
    </div>
  )
}
