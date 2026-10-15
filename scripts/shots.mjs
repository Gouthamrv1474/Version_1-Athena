// Drives every step for all four path/level combinations and saves screenshots to ./shots.
import { chromium } from 'playwright'

const base = process.env.URL ?? 'http://localhost:5173'
const browser = await chromium.launch({ executablePath: process.env.CHROME })
const errors = []
for (const path of ['epi', 'market']) {
  for (const level of ['market', 'sdz']) {
    const tag = `${path}-${level}`
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.on('console', (m) => m.type() === 'error' && errors.push(`${tag}: ${m.text()}`))
    page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`))
    await page.goto(base)
    const shot = async (n) => { await page.waitForTimeout(450); return page.screenshot({ path: `shots/${tag}-${n}.png`, fullPage: true }) }

    await page.getByRole('radio', { name: path === 'epi' ? /Epidemiology/ : /^Market/ }).click()
    await shot('1-start')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('radio', { name: level === 'market' ? /Market level/ : /Sandoz level/ }).click()
    await page.getByLabel('United States').check()
    await page.getByLabel('Germany').check()
    await page.getByLabel('Product', { exact: true }).selectOption({ index: 1 })
    await page.getByRole('radio', { name: 'Yes' }).click()
    await shot('2-level')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Fill sample values' }).click()
    await shot('3-assumptions')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Use sample data' }).click()
    await shot('4-inputs')
    await page.getByRole('button', { name: 'Continue to output' }).click()
    await page.getByRole('button', { name: 'Run forecast' }).click()
    await page.getByText('Forecast complete.').waitFor()
    await shot('5-output')
    await page.close()
  }
}
await browser.close()
console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join('\n')}` : 'no console errors')
