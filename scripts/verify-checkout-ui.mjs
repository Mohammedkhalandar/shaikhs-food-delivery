// Real React UI; API and SDK boundaries are mocked. Signed callback fixtures contain no secrets.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Local test server only');
const signature = createHmac('sha256', 'fixture-server-secret-not-shipped-to-browser').update('order_uiFixture|pay_uiFixture').digest('hex');
const callback = { razorpay_order_id: 'order_uiFixture', razorpay_payment_id: 'pay_uiFixture', razorpay_signature: signature };
let browser;
let checks = 0;
const results = [];
function check(value, label) { assert.ok(value, label); checks++; }
const sdk = `window.Razorpay=class {
  constructor(options){this.options=options;window.__sdkOptions=options;window.__sdk=this;}
  on(event,handler){this.failed=handler;}
  close(){this.options.modal.ondismiss();}
  open(){window.__opens=(window.__opens||0)+1;const mode=window.__mode;queueMicrotask(()=>{
    if(mode==='cancel')this.close();
    else if(mode==='failure'){this.failed();this.close();}
    else if(mode!=='hold'){const data=${JSON.stringify(callback)};if(mode==='bad-signature')data.razorpay_signature='0'.repeat(64);this.options.handler(data);if(mode==='duplicate')this.options.handler(data);}
  });}
};`;

async function setup(mode = 'success', width = 390, enabled = true) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript(value => { window.__mode = value; }, mode);
  const state = { orders: [], payment: null, confirms: 0, prepares: 0, reconciles: 0, scripts: 0, creates: 0, keys: [], pendingAuth: false, verifyUnavailable: false, lostConfirmation: false, snapPaid: false, configEnabled: enabled, errors: [] };
  const payment = () => ({ id: 'payment_uiFixture', orderId: 'app-order-fixture', amount: 29645, currency: 'INR', providerOrderId: 'order_uiFixture', state: state.snapPaid ? 'CAPTURED' : 'PENDING', needsReview: false, awaitingCapture: state.pendingAuth });
  await context.route('https://checkout.razorpay.com/v1/checkout.js', async route => {
    state.scripts++;
    if (mode === 'sdk-failure' && state.scripts === 1) return route.abort('failed');
    if (mode === 'sdk-missing' && state.scripts === 1) return route.fulfill({ contentType: 'application/javascript', body: '' });
    return route.fulfill({ contentType: 'application/javascript', body: sdk });
  });
  await context.route('**/api/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname;
    const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (path === '/api/auth/me') return json({ user: { id: 'customer-fixture', name: 'Fixture Customer', email: 'fixture@example.test', role: 'CUSTOMER' } });
    if (path === '/api/payments/config') return json({ enabled: state.configEnabled, mode: 'test' });
    if (path === '/api/delivery/policy') return json({ policy: { deliveryFee:'35.00', freeThreshold:'499.00', version:0 } });
    if (path === '/api/customer/addresses') return json({addresses:[]});
    if (path === '/api/catalog/retry') return json({products:[]}); // Public fixture already contains its basket item.
    if (path === '/api/delivery/quote') return json({quote:{subtotal:'249',tax:'12.45',deliveryFee:'35',total:'296.45',policyVersion:0,quoteToken:'a'.repeat(64),zoneName:'Synthetic postal fixture',message:'Mock quote only; no real serviceability or transaction.',lines:[{unitPrice:'249',lineTotal:'249',nameSnapshot:'Fixture Biryani'}]}});
    if (path === '/api/catalog') return json({ products: [{ id: 'dish-fixture', name: 'Fixture Biryani', description: 'Checkout test fixture', category: 'Biryani', price: '249', imageUrl: '/images/biryani.jpg', restaurantId: 'kitchen-fixture', restaurant: { id: 'kitchen-fixture', name: 'Fixture Kitchen', city: 'Raichur' } }] });
    if (path === '/api/orders' && req.method() === 'GET') return json({ orders: state.orders.map(order => ({ ...order, paymentStatus: state.snapPaid ? 'PAID' : 'PENDING' })) });
    if (path === '/api/orders' && req.method() === 'POST') {
      const input = req.postDataJSON(); assert.equal(input.paymentMethod, 'ONLINE');
      const key = req.headers()['idempotency-key']; check(Boolean(key), 'checkout retry key supplied'); state.keys.push(key);
      if (!state.orders.length) { state.creates++; state.orders.push({ id: 'app-order-fixture', orderNumber: 'SHAIKHS-UI-FIXTURE', status: 'PLACED', paymentMethod: 'ONLINE', paymentStatus: 'PENDING', total: '296.45', createdAt: new Date().toISOString(), restaurant: { name: 'Fixture Kitchen' }, items: [{ id: 'line', quantity: 1, nameSnapshot: 'Fixture Biryani' }] }); }
      if (mode === 'order-lost' && state.keys.length === 1) return route.abort('failed');
      return json({ order: state.orders[0] }, state.keys.length === 1 ? 201 : 200);
    }
    if (path === '/api/payments/status') { assert.equal(url.searchParams.get('orderId'), 'app-order-fixture'); const record = payment(); delete record.awaitingCapture; return json({ order: { id: 'app-order-fixture', status: 'PLACED', paymentStatus: state.snapPaid ? 'PAID' : 'PENDING' }, payment: state.payment ? record : null }); }
    if (path === '/api/payments/orders') {
      assert.deepEqual(req.postDataJSON(), { orderId: 'app-order-fixture' }); state.prepares++; state.payment = payment();
      return json({ payment: { ...payment(), keyId: mode === 'live-key' ? 'rzp_live_forbidden' : 'rzp_test_uiFixture' } });
    }
    if (path.endsWith('/reconcile')) { state.reconciles++; return json({ payment: payment() }); }
    if (path.endsWith('/verify')) {
      state.confirms++; const body = req.postDataJSON();
      assert.deepEqual(Object.keys(body).sort(), Object.keys(callback).sort());
      if (body.razorpay_signature !== signature) return json({ error: 'Invalid payment signature' }, 401);
      assert.deepEqual(body, callback);
      if (state.verifyUnavailable) return json({ error: 'Fixture interruption' }, 503);
      if (mode === 'authorized') state.pendingAuth = true;
      if (!state.pendingAuth) state.snapPaid = true;
      if (state.lostConfirmation) return route.abort('failed');
      return json({ payment: payment() });
    }
    if(path==='/api/notifications')return json({unreadCount:0,notifications:[],nextPage:null});
    state.errors.push(`Unexpected API ${path}`); return json({ error: 'Unexpected fixture API' }, 500);
  });
  const page = await context.newPage(); page.on('pageerror', error => state.errors.push(error.message));
  await page.goto(baseURL);
  await page.getByRole('button', { name: 'Add Fixture Biryani', exact: true }).click();
  await page.locator('.cartbtn').click();
  await page.getByLabel('Delivery address',{exact:true}).fill('12 Disposable Checkout Road');
  await page.getByLabel('Postal code',{exact:true}).fill('584101');
  return { context, page, state };
}
async function reserve(page) {
  await page.getByLabel('Payment method').selectOption('ONLINE');
  await page.getByRole('button', { name: 'Continue to test payment', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your recent orders' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pay ₹296.45/ })).toBeVisible();
}
async function pay(page) { await page.getByRole('button', { name: /Pay ₹296.45|Retry payment/ }).click(); }
async function run(name, test, mode = name, width = 390, enabled = true) {
  const fixture = await setup(mode, width, enabled);
  try { await test(fixture); check(fixture.state.errors.length === 0, `${name} browser errors: ${fixture.state.errors.join(',')}`); results.push({ name, result: 'PASS' }); }
  finally { await fixture.context.close(); }
}
async function main() {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  await fs.mkdir('.test-artifacts/online-checkout', { recursive: true });
  await run('legacy saved checkout keeps its original retry key',async({page,state})=>{
    await page.evaluate(async()=>{
      const payload=JSON.stringify({restaurantId:'kitchen-fixture',deliveryAddress:'12 Disposable Checkout Road',paymentMethod:'ONLINE',items:[{productId:'dish-fixture',quantity:1}]});
      const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
      const fingerprint=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
      sessionStorage.setItem('shaikhs-checkout-attempt',JSON.stringify({fingerprint,key:'legacy-checkout-preserved-123',paymentMethod:'ONLINE'}));
    });
    await reserve(page);
    check(state.keys[0]==='legacy-checkout-preserved-123','new fee/configuration support preserves legacy saved checkout identity');
    check(state.creates===1,'legacy retry creates at most one application order');
  },'cancel');
  await run('disabled gate', async ({ page, state }) => {
    await expect(page.locator('option[value=ONLINE]')).toBeDisabled();
    check(state.scripts === 0, 'disabled checkout never loads SDK');
  }, 'success', 390, false);
  await run('duplicate callbacks and rapid clicks', async ({ page, state }) => {
    await reserve(page);
    await page.getByRole('button', { name: /Pay ₹296.45/ }).evaluate(button => { button.click(); button.click(); });
    await expect(page.getByText('Payment verified', { exact: true })).toBeVisible();
    check(state.creates === 1 && state.confirms === 1, 'one order and one callback verification');
    check(await page.evaluate(() => window.__opens) === 1, 'one SDK instance');
    const options = await page.evaluate(() => ({ key: window.__sdkOptions.key, amount: window.__sdkOptions.amount, currency: window.__sdkOptions.currency, order_id: window.__sdkOptions.order_id, retry: window.__sdkOptions.retry, animation: window.__sdkOptions.modal.animation, fields: Object.keys(window.__sdkOptions) }));
    check(options.amount === 29645 && options.key === 'rzp_test_uiFixture' && options.order_id === 'order_uiFixture', 'only server amount/test key/order supplied');
    check(options.retry.enabled === false && options.animation === false && !options.fields.includes('key_secret'), 'controlled retries, reduced motion, no secret');
  }, 'duplicate');
  await run('cancellation then retry', async ({ page, state }) => {
    await reserve(page); await pay(page);
    await expect(page.getByText(/Payment window closed/)).toBeVisible();
    await page.evaluate(() => { window.__mode = 'success'; }); await pay(page);
    await expect(page.getByText('Payment verified', { exact: true })).toBeVisible();
    check(state.creates === 1 && state.reconciles === 1 && state.confirms === 1, 'cancel retries same order after reconciliation');
  }, 'cancel');
  await run('failed attempt is never client-confirmed', async ({ page, state }) => {
    await reserve(page); await pay(page); await expect(page.getByText(/attempt did not complete/)).toBeVisible();
    check(state.confirms === 0 && !state.snapPaid, 'SDK failure cannot mark paid');
    await page.screenshot({ path: '.test-artifacts/online-checkout/failure-mobile.png', fullPage: true });
  }, 'failure');
  for (const mode of ['sdk-failure', 'sdk-missing']) await run(mode, async ({ page, state }) => {
    await reserve(page); await pay(page); await expect(page.locator('.online-payment').getByRole('alert')).toContainText('could not load');
    await page.evaluate(() => { window.__mode = 'success'; }); await pay(page);
    await expect(page.getByText('Payment verified', { exact: true })).toBeVisible();
    check(state.creates === 1 && state.scripts === 2 && state.confirms === 1, 'SDK load failure retry preserves order');
  }, mode);
  await run('interrupted confirmation recovers by server status', async ({ page, state }) => {
    await reserve(page); state.verifyUnavailable = true; await pay(page);
    await expect(page.getByText(/Confirmation was interrupted/)).toBeVisible();
    state.snapPaid = true;
    await page.getByRole('button', { name: 'Check payment status' }).click();
    await expect(page.getByText('Payment verified', { exact: true })).toBeVisible();
    check(state.creates === 1 && await page.evaluate(() => window.__opens) === 1, 'status recovery opens no new checkout');
  }, 'success');
  await run('lost successful response still uses server evidence', async ({ page, state }) => {
    await reserve(page); state.lostConfirmation = true; await pay(page);
    await expect(page.getByText('Payment verified', { exact: true })).toBeVisible();
    check(state.confirms === 1 && state.creates === 1, 'lost callback response does not duplicate payment');
  }, 'success');
  await run('pending authorization blocks another payment', async ({ page, state }) => {
    await reserve(page); await pay(page);
    await expect(page.getByText(/authorization is pending/)).toBeVisible(); await pay(page);
    await expect.poll(() => state.reconciles).toBe(1);
    await expect(page.getByText(/authorization is pending/)).toBeVisible();
    check(await page.evaluate(() => window.__opens) === 1 && state.reconciles === 1, 'pending authorization never reopens SDK');
  }, 'authorized');
  await run('bad signature cannot show payment success', async ({ page, state }) => {
    await reserve(page); await pay(page); await expect(page.getByText(/Confirmation was interrupted/)).toBeVisible();
    check(!state.snapPaid, 'invalid signature never marks paid');
  }, 'bad-signature');
  await run('live key blocked before SDK loading', async ({ page, state }) => {
    await reserve(page); await pay(page); await expect(page.locator('.online-payment').getByRole('alert')).toContainText('could not safely prepare');
    check(state.scripts === 0 && state.confirms === 0, 'live key cannot open checkout');
  }, 'live-key');
  await run('late webhook prevents a second checkout', async ({ page, state }) => {
    await reserve(page); state.snapPaid = true; await pay(page);
    await expect(page.getByText('Payment verified', { exact: true })).toBeVisible();
    check(state.prepares === 0 && state.scripts === 0, 'verified payment never reopens');
  }, 'success');
  await run('reloading retries the reserved order', async ({ page, state }) => {
    await reserve(page); await pay(page); await expect(page.getByText(/Payment window closed/)).toBeVisible();
    await page.reload(); await expect(page.locator('.userpill')).toBeVisible(); await page.locator('.userpill').click();
    await page.evaluate(() => { window.__mode = 'success'; }); await pay(page);
    await expect(page.getByText('Payment verified', { exact: true })).toBeVisible();
    check(state.creates === 1 && state.reconciles === 1, 'reload does not create another app order');
  }, 'cancel');
  await run('lost order response retains online mode and idempotency after reload', async ({ page, state }) => {
    await page.getByLabel('Payment method').selectOption('ONLINE');
    await page.getByRole('button', { name: 'Continue to test payment', exact: true }).click();
    await expect(page.locator('.toast')).toContainText(/fetch|network/i);
    await page.reload(); await expect(page.locator('.userpill')).toBeVisible(); await page.locator('.cartbtn').click();
    await expect(page.getByLabel('Payment method')).toHaveValue('ONLINE');
    await page.getByLabel('Delivery address',{exact:true}).fill('12 Disposable Checkout Road');
    await page.getByLabel('Postal code',{exact:true}).fill('584101');
    await page.getByRole('button', { name: 'Continue to test payment', exact: true }).click();
    await pay(page); await expect(page.getByText('Payment verified', { exact: true })).toBeVisible();
    check(state.creates === 1 && state.keys.length === 2 && state.keys[0] === state.keys[1], 'uncertain order reuses the same intent/key');
  }, 'order-lost');
  await run('stale client cannot bypass a closed sandbox gate', async ({ page, state }) => {
    await reserve(page); state.configEnabled = false; await pay(page);
    await expect(page.locator('.online-payment').getByRole('alert')).toContainText('unavailable');
    check(state.creates === 1 && state.prepares === 0 && state.scripts === 0, 'server capability rechecked before SDK');
  }, 'success');
  for (const width of [390, 768, 1440]) await run(`responsive ${width}`, async ({ page }) => {
    await reserve(page); await pay(page); await expect(page.getByText(/Payment window closed/)).toBeVisible();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no overflow ${width}`);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    check(axe.violations.length === 0, `axe ${width}: ${axe.violations.map(v => v.id).join(',')}`);
    await page.screenshot({ path: `.test-artifacts/online-checkout/pending-${width}.png`, fullPage: true });
  }, 'cancel', width);
  await run('tab lock prevents concurrent checkout windows', async ({ context, page, state }) => {
    await reserve(page); await pay(page); await expect(page.getByRole('status').filter({ hasText: 'Complete your test payment' })).toBeVisible();
    const other = await context.newPage(); await other.goto(baseURL); await expect(other.locator('.userpill')).toBeVisible(); await other.locator('.userpill').click(); await pay(other);
    await expect(other.locator('.online-payment').getByRole('alert')).toContainText('another tab');
    check(state.prepares === 1, 'other tab cannot prepare a second checkout');
    await page.evaluate(() => window.__sdk.close());
  }, 'hold');
  await fs.writeFile('.test-artifacts/online-checkout/results.json', JSON.stringify({ result: 'PASS', scenarios: results, checks, boundary: 'mocked API/SDK; signed fixtures; no provider contact' }, null, 2));
  console.log(`PASS: ${results.length} online checkout scenarios, ${checks} assertions, three axe scans; mocked SDK/API, no provider contact`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => browser?.close());
