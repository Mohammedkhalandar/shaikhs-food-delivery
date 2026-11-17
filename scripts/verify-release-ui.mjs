import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const bundle = await build({
  stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import { ErrorState } from './src/components/error-state'; createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorState reset={()=>{window.__retries=(window.__retries||0)+1}} digest="private-fixture-error" area="root" /></React.StrictMode>);`, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, platform: 'browser', format: 'iife', write: false, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
});
let browser;
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
async function main() {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  await fs.mkdir('.test-artifacts/release-ui', { recursive: true });
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = []; const reports = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('http://127.0.0.1:3199/**', route => {
      if (new URL(route.request().url()).pathname === '/fixture.js') return route.fulfill({ contentType: 'application/javascript', body: bundle.outputFiles[0].text });
      if (new URL(route.request().url()).pathname === '/api/monitoring/client-error') {
        reports.push(route.request().postDataJSON());
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ reportId: '00000000-0000-4000-8000-000000000001' }) });
      }
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><title>Error recovery fixture</title></head><body style="margin:0"><div id="root"></div><script src="/fixture.js"></script></body></html>' });
    });
    await page.goto('http://127.0.0.1:3199/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('We’ll get you back');
    await expect(page.getByRole('status')).toContainText('Support reference');
    check(reports.length === 1 && reports[0].area === 'root', 'single metadata report');
    check(reports[0].fingerprint === createHash('sha256').update('private-fixture-error').digest('hex'), 'digest hashed before transport');
    check(!JSON.stringify(reports).includes('private-fixture-error'), 'raw digest not sent');
    await page.getByRole('button', { name: 'Try again' }).click();
    check(await page.evaluate(() => window.__retries) === 1, 'recovery reset wired');
    check(await page.getByRole('link', { name: 'Return to menu' }).getAttribute('href') === '/', 'safe recovery destination');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow');
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    await fs.writeFile(`.test-artifacts/release-ui/axe-${width}.json`, JSON.stringify(axe.violations, null, 2));
    await page.screenshot({ path: `.test-artifacts/release-ui/error-${width}.png`, fullPage: true });
    if (width === 390) {
      await page.route('http://127.0.0.1:3199/api/monitoring/client-error', route => route.abort('failed'));
      await page.reload(); await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
      await page.getByRole('button', { name: 'Try again' }).click();
      check(await page.evaluate(() => window.__retries) === 1, 'offline reporting does not block recovery');
      check(errors.length === 0, 'offline report failure is handled');
    }
    check(axe.violations.length === 0, `axe: ${axe.violations.map(v => v.id).join(',')}`);
    check(errors.length === 0, `browser errors: ${errors.join(',')}`);
    await page.screenshot({ path: `.test-artifacts/release-ui/error-${width}.png`, fullPage: true });
    await context.close();
  }
  console.log(`PASS: ${checks} recovery UI assertions, three axe scans; actual shared component, synthetic failure fixture`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => browser?.close());
