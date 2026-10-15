// Placeholder lists. Replace with real geographies, products, channels and sources.
export const GEOGRAPHIES = [
  'United States', 'Germany', 'France', 'United Kingdom', 'Italy', 'Spain',
  'Japan', 'Brazil', 'Canada', 'Switzerland',
]

export const PRODUCTS = [
  'Product A (oral solid)', 'Product B (injectable)', 'Product C (biosimilar mAb)',
  'Product D (inhaler)', 'Product E (ophthalmic)',
]

export const CHANNELS = ['Retail', 'Hospital', 'Mail order', 'Specialty']

export const SOURCES = [
  'IQVIA', 'Internal estimate', 'Published literature', 'Payer data', 'Expert panel', 'Analogue',
]

export const CURRENCIES = ['USD', 'EUR', 'CHF'] as const
// Mock conversion from USD, used only by the mock engine.
export const FX: Record<(typeof CURRENCIES)[number], number> = { USD: 1, EUR: 0.92, CHF: 0.88 }

export const SKUS = [
  { sku: 'Pack of 30', share: 55, priceIndex: 1.0 },
  { sku: 'Pack of 90', share: 30, priceIndex: 0.92 },
  { sku: 'Hospital pack', share: 15, priceIndex: 0.8 },
]

export const ANALOGUES = [
  { id: 'an1', name: 'Gx entry · oral solid · 3 entrants', type: 'Gx', peakShare: 42, years: 4 },
  { id: 'an2', name: 'Gx entry · oral solid · 6+ entrants', type: 'Gx', peakShare: 28, years: 3 },
  { id: 'an3', name: 'Biosimilar · mAb · first wave', type: 'Bio', peakShare: 31, years: 5 },
  { id: 'an4', name: 'Biosimilar · mAb · late entrant', type: 'Bio', peakShare: 14, years: 5 },
  { id: 'an5', name: 'Gx · injectable · tender market', type: 'Gx', peakShare: 36, years: 3 },
]

export const RISK_ITEMS = [
  { id: 'ip', name: 'IP and litigation', likelihood: 30, delayMonths: 9 },
  { id: 'dev', name: 'Development', likelihood: 15, delayMonths: 6 },
  { id: 'reg', name: 'Regulatory approval', likelihood: 20, delayMonths: 8 },
]

export const DEFAULT_EVENTS = [
  { id: 'ev1', name: 'Market access expansion', impact: 6, likelihood: 60 },
]
