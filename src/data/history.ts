import type { HistoryRow } from '../store/types'

// Deterministic sample: 36 months of originator volume (k units), 2024-01 to 2026-12.
export const SAMPLE_HISTORY: HistoryRow[] = Array.from({ length: 36 }, (_, i) => {
  const year = 2024 + Math.floor(i / 12)
  const m = i % 12
  const trend = 920 * Math.pow(1.04, i / 12)
  const season = 1 + 0.05 * Math.sin((2 * Math.PI * (m - 2)) / 12)
  return { period: `${year}-${String(m + 1).padStart(2, '0')}`, volume: Math.round(trend * season) }
})

export const SAMPLE_CSV =
  'period,volume\n' + SAMPLE_HISTORY.map((r) => `${r.period},${r.volume}`).join('\n')
