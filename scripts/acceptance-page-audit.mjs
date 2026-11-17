// Actual rendered pages, invoked from the authenticated PostgreSQL workflow.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
const pages = [];
export async function auditAcceptancePage(page, label) {
  const privateResponse = await page.request.get(new URL('/api/orders', page.url()).toString());
  assert.equal(privateResponse.status(), 200, `${label}: authorized order history`);
  assert.equal(privateResponse.headers()['cache-control'], 'no-store', `${label}: private history cache protection`);
  await page.evaluate(() => document.fonts.ready);
  const evidence = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    unfinishedLinks: [...document.querySelectorAll('a[href]')].filter(a => {
      const href = a.getAttribute('href');
      return /^(#$|javascript:)/i.test(href);
    }).length,
    imagesWithoutAlternatives: [...document.images].filter(i => !i.hasAttribute('alt')).length,
    brokenLoadedImages: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => new URL(i.src).pathname),
    fontFamily: getComputedStyle(document.body).fontFamily,
    manifest: !!document.querySelector('link[rel="manifest"]'),
    runningAnimations: document.getAnimations().filter(a => a.playState === 'running').length,
  }));
  assert.equal(evidence.overflow, false, `${label}: overflow`);
  assert.equal(evidence.reducedMotion, true, `${label}: reduced motion preference`);
  assert.equal(evidence.unfinishedLinks, 0, `${label}: placeholder links`);
  assert.equal(evidence.imagesWithoutAlternatives, 0, `${label}: missing image alt`);
  assert.equal(evidence.brokenLoadedImages.length, 0, `${label}: broken loaded images`);
  assert.equal(evidence.runningAnimations, 0, `${label}: running animations despite reduced motion`);
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => document.activeElement !== document.body), `${label}: keyboard focus`);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.equal(axe.violations.length, 0, `${label}: ${axe.violations.map(v => v.id).join(',')}`);
  pages.push({ label, ...evidence, authenticatedCacheControl: privateResponse.headers()['cache-control'], axeViolations: 0 });
  const menuLink = page.getByRole('link', { name: 'Menu', exact: true });
  if (await menuLink.isVisible()) {
    await menuLink.click();
    await page.locator('#menu').waitFor({ state: 'visible' });
    await page.getByRole('link', { name: 'Our story', exact: true }).click();
    await page.locator('#story').waitFor({ state: 'visible' });
  }
}
export async function saveAcceptanceAudit() {
  await fs.mkdir('.test-artifacts/final-acceptance', { recursive: true });
  await fs.writeFile('.test-artifacts/final-acceptance/responsive.json', JSON.stringify({ pages, scope: 'Browser emulation, not physical-device installation or field performance' }, null, 2));
}
