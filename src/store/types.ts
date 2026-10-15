export type Path = 'epi' | 'market' | null
export type Level = 'market' | 'sdz' | null
export type Granularity = 'Monthly' | 'Quarterly' | 'Annual'
export type ModuleKey = 'epi' | 'events' | 'segments' | 'sku'

export interface Assumption {
  id: string
  name: string
  unit: string
  value: string
  source: string
  comment: string
}
export interface HistoryRow { period: string; volume: number }
export interface MarketEvent { id: string; name: string; impact: number; likelihood: number }
export interface Risk { id: string; name: string; likelihood: number; delayMonths: number }
export interface Sku { sku: string; share: number; priceIndex: number }

export interface Scope {
  geos: string[]
  product: string | null
  granularity: Granularity
  channels: boolean
}
export interface Inputs {
  historyName: string | null
  history: HistoryRow[] | null
  events: MarketEvent[]
  channelSplit: Record<string, number>
  risks: Risk[]
  competitors: number
  entryOrder: number
  analogues: string[]
  price: { list: number; discount: number; g2n: number; cogs: number }
  skuMix: Sku[]
}
export interface ModelCfg {
  horizon: number
  firstYear: number
  currency: 'USD' | 'EUR' | 'CHF'
  discountRate: number
  mc: boolean
  sims: number
  upside: boolean
  downside: boolean
}
