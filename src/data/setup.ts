import { GEOGRAPHIES, PRODUCTS, SOURCES } from './lists'
import type { Granularity } from '../store/types'

// One tidy file: each row is a geography, a product, a setting or an assumption.
export const SETUP_TEMPLATE = `type,name,value,unit,source,comment
geography,Germany,,,,
geography,France,,,,
product,Product A (oral solid),,,,
setting,granularity,Quarterly,,,
setting,channels,Yes,,,
assumption,Market size,12400,,IQVIA,2024 baseline
assumption,Market growth rate,3.5,,Published literature,
assumption,Price erosion per year,4,,Internal estimate,
assumption,Peak patients per site,18,patients,Expert panel,Not in the library so added as a custom row
`

export interface SetupAssumption { name: string; value: string; unit: string; source: string; comment: string }
export interface SetupData {
  geos: string[]
  products: string[]
  granularity?: Granularity
  channels?: boolean
  assumptions: SetupAssumption[]
  warnings: string[]
}

const GRANULARITIES: Granularity[] = ['Monthly', 'Quarterly', 'Annual']
const canon = (list: readonly string[], v: string) => list.find((x) => x.toLowerCase() === v.toLowerCase())
const TYPES: Record<string, 'geo' | 'product' | 'setting' | 'assumption'> = {
  geography: 'geo', country: 'geo', geo: 'geo', product: 'product', setting: 'setting',
  assumption: 'assumption', parameter: 'assumption',
}

/** Returns null when the file has no usable `type` and `name` columns. */
export function parseSetup(rows: Record<string, string>[]): SetupData | null {
  if (!rows.length || !('type' in rows[0]) || !('name' in rows[0])) return null
  const d: SetupData = { geos: [], products: [], assumptions: [], warnings: [] }
  const get = (r: Record<string, string>, k: string) => (r[k] ?? '').trim()

  rows.forEach((r, i) => {
    const line = i + 2 // header is line 1
    const type = TYPES[get(r, 'type').toLowerCase()]
    const name = get(r, 'name')
    const value = get(r, 'value')
    if (!type) return void d.warnings.push(`Line ${line}: unknown type "${get(r, 'type')}"`)
    if (!name) return void d.warnings.push(`Line ${line}: name is empty`)

    if (type === 'geo' || type === 'product') {
      const hit = canon(type === 'geo' ? GEOGRAPHIES : PRODUCTS, name)
      const list = type === 'geo' ? d.geos : d.products
      if (!hit) d.warnings.push(`Line ${line}: "${name}" is not a known ${type === 'geo' ? 'geography' : 'product'}`)
      else if (!list.includes(hit)) list.push(hit)
    } else if (type === 'setting') {
      const key = name.toLowerCase()
      if (key === 'granularity') {
        const g = canon(GRANULARITIES, value) as Granularity | undefined
        if (g) d.granularity = g
        else d.warnings.push(`Line ${line}: granularity must be Monthly, Quarterly or Annual`)
      } else if (key === 'channels') {
        if (/^(yes|no)$/i.test(value)) d.channels = value.toLowerCase() === 'yes'
        else d.warnings.push(`Line ${line}: channels must be Yes or No`)
      } else d.warnings.push(`Line ${line}: unknown setting "${name}"`)
    } else {
      if (value === '' || !Number.isFinite(Number(value))) return void d.warnings.push(`Line ${line}: "${name}" needs a numeric value`)
      const source = get(r, 'source')
      const known = canon(SOURCES, source)
      if (source && !known) d.warnings.push(`Line ${line}: source "${source}" is not in the source list, left blank`)
      d.assumptions.push({ name, value, unit: get(r, 'unit'), source: known ?? '', comment: get(r, 'comment') })
    }
  })
  return d
}
