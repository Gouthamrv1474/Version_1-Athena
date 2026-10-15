import type { Level, Path } from '../store/types'

export interface ParamDef {
  id: string
  name: string
  unit: string
  sample: string // value used by "Fill sample values"
  hint?: string
}

// Master list. Library items are everything here that is not in the current table.
export const PARAMS: Record<string, ParamDef> = {
  population: { id: 'population', name: 'Population', unit: 'million', sample: '84.2' },
  incidence: { id: 'incidence', name: 'Incidence rate', unit: 'per 100k', sample: '62' },
  prevalence: { id: 'prevalence', name: 'Prevalence rate', unit: '%', sample: '1.8' },
  diagnosis: { id: 'diagnosis', name: 'Diagnosis rate', unit: '%', sample: '71' },
  treatment: { id: 'treatment', name: 'Treatment rate', unit: '%', sample: '58' },
  uptake: { id: 'uptake', name: 'Uptake curve (peak)', unit: '% at year 5', sample: '45' },
  marketSize: { id: 'marketSize', name: 'Market size', unit: 'k units / yr', sample: '12400' },
  growth: { id: 'growth', name: 'Market growth rate', unit: '% CAGR', sample: '3.5' },
  segmentation: { id: 'segmentation', name: 'Market segmentation', unit: '% retail', sample: '64' },
  sdzShare: { id: 'sdzShare', name: 'Sandoz share', unit: '%', sample: '24' },
  compShare: { id: 'compShare', name: 'Competitive share', unit: '%', sample: '38' },
  price: { id: 'price', name: 'Price', unit: 'USD / unit', sample: '118' },
  // Sandoz level
  gxPen: { id: 'gxPen', name: 'Gx/Bio penetration', unit: '% of volume', sample: '38' },
  netDiscount: { id: 'netDiscount', name: 'Net price discount vs originator', unit: '%', sample: '35' },
  launch: { id: 'launch', name: 'Launch timing', unit: 'year', sample: '2028' },
  sdzGxShare: { id: 'sdzGxShare', name: 'Sandoz share of Gx/Bio', unit: '%', sample: '24' },
  // Library extras
  patientsPerHcp: { id: 'patientsPerHcp', name: 'Patients per prescriber', unit: 'count', sample: '14' },
  persistence: { id: 'persistence', name: 'Persistence at 12 months', unit: '%', sample: '62' },
  compliance: { id: 'compliance', name: 'Compliance', unit: '%', sample: '78' },
  rebate: { id: 'rebate', name: 'Average rebate', unit: '%', sample: '12' },
  tenderShare: { id: 'tenderShare', name: 'Tender share of volume', unit: '%', sample: '22' },
  inflation: { id: 'inflation', name: 'Price erosion per year', unit: '%', sample: '4' },
}

export const LIBRARY_IDS = Object.keys(PARAMS)

export function defaultParamIds(path: Path, level: Level): string[] {
  const base =
    path === 'epi'
      ? ['population', 'incidence', 'prevalence', 'diagnosis', 'treatment', 'uptake']
      : ['marketSize', 'growth', 'segmentation', 'sdzShare', 'compShare', 'price']
  if (level !== 'sdz') return base
  return [...base, 'gxPen', 'netDiscount', 'launch', ...(path === 'epi' ? ['sdzGxShare'] : [])]
}
