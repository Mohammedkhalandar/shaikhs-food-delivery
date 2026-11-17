// Acceptance findings may be MISSING: absence is never reported as a passing PWA.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  await fs.mkdir('.test-artifacts/final-acceptance', { recursive: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const routes = [];
  for (const path of ['/', '/partner', '/recover', '/verify-email', '/staff', '/api/health', '/api/health/ready']) {
    const response = await page.request.get(base + path);
    assert.equal(response.status(), 200, path);
    routes.push({ path, status: response.status() });
  }
  const config = await (await page.request.get(base + '/api/payments/config')).json();
  assert.equal(config.enabled, false, 'ONLINE must remain disabled');
  const privateResponse = await page.request.get(base + '/api/orders');
  assert.equal(privateResponse.status(), 401);
  assert.equal(privateResponse.headers()['cache-control'], 'no-store', 'private failures cannot be cached');
  await page.goto(base);
  await page.locator('.product-card').first().waitFor({ state: 'visible', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  const categoryViews = [];
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const navigation = page.getByRole('navigation', { name: 'Dish categories' });
    const box = await navigation.boundingBox();
    assert.ok(box && box.height < 100, 'Category navigation must leave room for food cards');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No viewport overflow');
    await navigation.getByRole('button').last().focus();
    await page.keyboard.press('Enter');
    assert.equal(await navigation.getByRole('button').last().getAttribute('aria-pressed'), 'true', 'Keyboard filter selection is exposed to assistive technology');
    await page.locator('.product-card').first().waitFor();
    const reset = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.pathname === '/api/catalog' && !url.searchParams.has('category') && !url.searchParams.has('ids') && response.status() === 200;
    });
    await navigation.getByRole('button', { name: 'All', exact: true }).click();
    const resetPage = await (await reset).json();
    await expect(page.locator('.product-card')).toHaveCount(resetPage.products.length);
    await page.locator('#menu').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForFunction(() => [...document.images].filter(i => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).every(i => i.complete && i.naturalWidth > 0));
    const axe = await new AxeBuilder({ page }).include('nav[aria-label="Dish categories"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    await fs.writeFile(`.test-artifacts/final-acceptance/category-axe-${width}.json`, JSON.stringify(axe.violations, null, 2));
    assert.equal(axe.violations.length, 0, 'Category navigation accessibility: '+axe.violations.map(v=>v.id).join(','));
    await page.screenshot({ path: `.test-artifacts/final-acceptance/categories-${width}.png` });
    categoryViews.push({ width, height: box.height, keyboardSelection: true, axeViolations: 0 });
  }
  const pwa = await page.evaluate(async () => ({
    manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href') || null,
    icons: [...document.querySelectorAll('link[rel*="icon"]')].map(n => n.getAttribute('href')),
    serviceWorkers: (await navigator.serviceWorker.getRegistrations()).length,
    cacheNames: await caches.keys(),
    fonts: { dmSans: document.fonts.check('400 16px "DM Sans"'), playfair: document.fonts.check('600 16px "Playfair Display"') },
  }));
  const client = await context.newCDPSession(page);
  await client.send('Page.enable');
  const installability = await client.send('Page.getInstallabilityErrors');
  await context.setOffline(true);
  let offlineNavigation = 'browser-network-error';
  try { await page.reload({ timeout: 10000 }); offlineNavigation = 'rendered'; } catch { /* Recorded gap, not an install claim. */ }
  await context.setOffline(false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/not-a-real-shaikhs-page');
  assert.equal(await page.getByRole('heading', { name: '404' }).count(), 1);
  await page.screenshot({ path: '.test-artifacts/final-acceptance/not-found-mobile.png', fullPage: true });
  await fs.writeFile('.test-artifacts/final-acceptance/web.json', JSON.stringify({ routes, categoryViews, onlineEnabled: false, unauthorizedOrders: privateResponse.status(), privateCacheControl: privateResponse.headers()['cache-control'] || null, pwa, installabilityErrors: installability.installabilityErrors, offlineNavigation, physicalInstallation: 'NOT TESTED', performance: 'No representative field LCP/INP/CLS acceptance; browser timing is not production evidence' }, null, 2));
  console.log(`PASS: seven public/readiness routes, private-order denial, ONLINE gate and rendered 404; PWA manifest ${pwa.manifest ? 'present' : 'MISSING'}, workers ${pwa.serviceWorkers}, offline ${offlineNavigation}; installation NOT verified`);
} finally { await browser.close(); }
