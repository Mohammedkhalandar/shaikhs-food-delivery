import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Local test server required');
let checks = 0;
async function main() {
  const ready = await fetch(`${base}/api/health/ready`);
  assert.equal(ready.status, 200); assert.deepEqual(await ready.json(), { status: 'ready' }); checks++;
  assert.equal(ready.headers.get('cache-control'), 'no-store'); checks++;
  const send = (data, origin = base) => fetch(`${base}/api/monitoring/client-error`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: data });
  assert.equal((await send('{"area":"root"}', 'https://untrusted.example')).status, 403); checks++;
  assert.equal((await send('{"area":"root"}', null)).status, 403); checks++;
  assert.equal((await send('{"area":"root","message":"must-not-log"}')).status, 400); checks++;
  assert.equal((await send('x'.repeat(16385))).status, 413); checks++;
  const report = await send(JSON.stringify({ area: 'route', fingerprint: 'a'.repeat(64) }));
  assert.equal(report.status, 202); assert.match((await report.json()).reportId, /^[a-f0-9-]{36}$/); checks++;
  assert.equal(report.headers.get('cache-control'), 'no-store'); checks++;
  assert.deepEqual(await (await fetch(`${base}/api/payments/config`)).json(), { enabled: false, mode: 'test' }); checks++;
  assert.equal((await fetch(`${base}/api/health`)).status, 200); checks++;
  console.log(`PASS: ${checks} real HTTP readiness/monitoring/origin/gate checks`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
