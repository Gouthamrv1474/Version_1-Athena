// Run: npx tsx scripts/setup.check.ts
import assert from 'node:assert/strict'
import Papa from 'papaparse'
import { SETUP_TEMPLATE, parseSetup } from '../src/data/setup'

const parse = (csv: string) => parseSetup(Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() }).data)!

const t = parse(SETUP_TEMPLATE)
assert.deepEqual(t.geos, ['Germany', 'France'])
assert.equal(t.granularity, 'Quarterly')
assert.equal(t.channels, true)
assert.equal(t.assumptions.length, 4)
assert.deepEqual(t.warnings, [])

const d = parse('type,name,value,source\ngeography,germany\ngeography,Atlantis\nsetting,granularity,annual\nassumption,Market size,12400,iqvia\nassumption,Growth,abc')
assert.deepEqual(d.geos, ['Germany'])
assert.equal(d.granularity, 'Annual')
assert.equal(d.assumptions[0].source, 'IQVIA')
assert.equal(d.warnings.length, 2)
assert.equal(parseSetup([{ a: '1' }]), null)
console.log('setup parser ok')
