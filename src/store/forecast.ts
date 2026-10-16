import { create } from 'zustand'
import { ANALOGUES, CHANNELS, DEFAULT_EVENTS, RISK_ITEMS, SKUS } from '../data/lists'
import { PARAMS, defaultParamIds, findParamId } from '../data/parameters'
import type { SetupData } from '../data/setup'
import type { Assumption, Inputs, Level, ModelCfg, ModuleKey, Path, Scope } from './types'

export const STEPS = [
  { n: 1, name: 'Start', short: 'Starting point and level' },
  { n: 2, name: 'Scope', short: 'Geography and products' },
  { n: 3, name: 'Assumptions', short: 'Key parameters' },
  { n: 4, name: 'Inputs', short: 'Data and drivers' },
  { n: 5, name: 'Output', short: 'Run and review' },
] as const

const toRow = (id: string): Assumption => {
  const p = PARAMS[id]
  return { id, name: p.name, unit: p.unit, value: '', source: '', comment: '' }
}
/** Predicate: does this table row correspond to the uploaded assumption? */
const matches = (a: { name: string }) => {
  const id = findParamId(a.name)
  return (r: Assumption) => (id ? r.id === id : r.name.toLowerCase() === a.name.toLowerCase())
}
export const isNewAssumption = (rows: Assumption[], a: { name: string }) => !rows.some(matches(a))
export const rowsFor = (path: Path, level: Level) => defaultParamIds(path, level).map(toRow)

const defaultSplit = () =>
  Object.fromEntries(CHANNELS.map((c, i) => [c, [40, 30, 20, 10][i] ?? 0]))

const freshInputs = (): Inputs => ({
  historyName: null,
  history: null,
  events: DEFAULT_EVENTS.map((e) => ({ ...e })),
  channelSplit: defaultSplit(),
  risks: RISK_ITEMS.map((r) => ({ ...r })),
  competitors: 3,
  entryOrder: 2,
  analogues: [ANALOGUES[0].id, ANALOGUES[2].id],
  price: { list: 120, discount: 35, g2n: 12, cogs: 22 },
  skuMix: SKUS.map((s) => ({ ...s })),
})

export interface State {
  step: number
  path: Path
  level: Level
  scope: Scope
  assumptions: Assumption[]
  inputs: Inputs
  modules: Record<ModuleKey, boolean>
  model: ModelCfg
  run: 'idle' | 'running' | 'done'
  ranWith: string | null
  toast: string | null
}

interface Actions {
  go: (n: number) => void
  setPath: (p: Path) => void
  setLevel: (l: Level) => void
  setScope: (s: Partial<Scope>) => void
  setAssumption: (id: string, patch: Partial<Assumption>) => void
  addAssumptions: (ids: string[]) => void
  addCustom: () => void
  removeAssumption: (id: string) => void
  fillSample: () => void
  importSetup: (d: SetupData) => void
  setInputs: (patch: Partial<Inputs>) => void
  setModule: (k: ModuleKey, on: boolean) => void
  setRun: (r: State['run'], ranWith?: string | null) => void
  showToast: (m: string | null) => void
}

const modulesFor = (path: Path, level: Level): Record<ModuleKey, boolean> => ({
  epi: path === 'epi',
  events: true,
  segments: false,
  sku: level === 'sdz',
})

export const useForecast = create<State & Actions>((set) => ({
  step: 1,
  path: null,
  level: null,
  scope: { geos: [], products: [], granularity: 'Monthly', channels: false },
  assumptions: [],
  inputs: freshInputs(),
  modules: modulesFor(null, null),
  model: {
    horizon: 10, firstYear: 2027, currency: 'USD', discountRate: 8,
    mc: true, sims: 5000, upside: true, downside: true,
  },
  run: 'idle',
  ranWith: null,
  toast: null,

  go: (step) => set({ step }),
  // Changing path or level resets the assumptions table, add-on switches and the run.
  // The chosen level survives a path change so the user only re-picks what they changed.
  setPath: (path) =>
    set((s) => ({
      path, assumptions: s.level ? rowsFor(path, s.level) : [], modules: modulesFor(path, s.level),
      run: 'idle', ranWith: null,
    })),
  setLevel: (level) =>
    set((s) => ({
      level, assumptions: rowsFor(s.path, level), modules: modulesFor(s.path, level),
      run: 'idle', ranWith: null,
    })),
  setScope: (p) => set((s) => ({ scope: { ...s.scope, ...p } })),
  setAssumption: (id, patch) =>
    set((s) => ({ assumptions: s.assumptions.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  addAssumptions: (ids) =>
    set((s) => ({
      assumptions: [
        ...s.assumptions,
        ...ids.filter((i) => !s.assumptions.some((a) => a.id === i)).map(toRow),
      ],
    })),
  addCustom: () =>
    set((s) => ({
      assumptions: [
        ...s.assumptions,
        { id: `custom-${Date.now()}`, name: '', unit: '', value: '', source: '', comment: '' },
      ],
    })),
  removeAssumption: (id) => set((s) => ({ assumptions: s.assumptions.filter((a) => a.id !== id) })),
  fillSample: () =>
    set((s) => ({
      assumptions: s.assumptions.map((a) => ({
        ...a,
        value: a.value || PARAMS[a.id]?.sample || '1',
        source: a.source || 'Internal estimate',
      })),
    })),
  // Fills scope and assumptions from an uploaded setup file. Needs a level so the table exists.
  importSetup: (d) =>
    set((s) => {
      const rows = [...s.assumptions]
      d.assumptions.forEach((a) => {
        const id = findParamId(a.name)
        const i = rows.findIndex(matches(a))
        const patch = { value: a.value, ...(a.source && { source: a.source }), ...(a.comment && { comment: a.comment }) }
        if (i >= 0) rows[i] = { ...rows[i], ...patch }
        else rows.push(id ? { ...toRow(id), ...patch } : { id: `custom-${Date.now()}-${rows.length}`, name: a.name, unit: a.unit, source: '', comment: '', ...patch })
      })
      return {
        assumptions: rows,
        scope: {
          ...s.scope,
          geos: d.geos.length ? d.geos : s.scope.geos,
          products: d.products.length ? d.products : s.scope.products,
          granularity: d.granularity ?? s.scope.granularity,
          channels: d.channels ?? s.scope.channels,
        },
      }
    }),
  setInputs: (p) => set((s) => ({ inputs: { ...s.inputs, ...p } })),
  setModule: (k, on) => set((s) => ({ modules: { ...s.modules, [k]: on } })),
  setRun: (run, ranWith) => set((s) => ({ run, ranWith: ranWith === undefined ? s.ranWith : ranWith })),
  showToast: (toast) => set({ toast }),
}))

// ---- Derived helpers (pure) -------------------------------------------------

export const isDefined = (a: Assumption) => a.name.trim() !== '' && a.value.trim() !== ''
export const definedCount = (s: State) => s.assumptions.filter(isDefined).length
export const channelTotal = (s: State) => Object.values(s.inputs.channelSplit).reduce((a, b) => a + b, 0)
export const skuTotal = (s: State) => s.inputs.skuMix.reduce((a, b) => a + b.share, 0)
export const historyRequired = (s: State) => s.path === 'market'
export const scopeComplete = (s: State) => s.scope.geos.length > 0 && s.scope.products.length > 0

/** Returns a reason string if the step is locked, else null. */
export function lockReason(s: State, n: number): string | null {
  if (n === 1) return null
  if (!s.path) return 'Choose where to start first'
  if (!s.level) return 'Choose a forecast level first'
  if (n === 5 && !scopeComplete(s)) return 'Select a geography and at least one product in step 2'
  return null
}

export function isComplete(s: State, n: number): boolean {
  switch (n) {
    case 1: return !!s.path && !!s.level
    case 2: return scopeComplete(s)
    case 3: return s.assumptions.length > 0 && definedCount(s) === s.assumptions.length
    case 4: return !!s.inputs.history
    case 5: return s.run === 'done'
    default: return false
  }
}

/** Fingerprint of everything the mock engine reads, to flag stale results. */
export const snapshotKey = (s: State) =>
  JSON.stringify([s.path, s.level, s.scope, s.assumptions, s.inputs, s.modules, s.model])
