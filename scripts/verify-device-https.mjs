// Read-only endpoint checks. Network authorization and physical installation require separate evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export function deviceOrigin(value) {
  const u = new URL(value);
  assert.ok(u.protocol === 'https:' && !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash, 'Use a plain HTTPS origin without credentials');
  assert.ok(u.hostname === 'localhost' || /^[a-z0-9-]+\.[a-z0-9-]+\.ts\.net$/.test(u.hostname), 'Use localhost or the actual private Tailscale Serve hostname');
  return u.origin;
}
export async function verifyDeviceHttps(value, request = fetch) {
  const origin = deviceOrigin(value);
  assert.notEqual(process.env.NODE_TLS_REJECT_UNAUTHORIZED, '0', 'TLS verification must remain enabled');
  const checks = [];
  async function get(route, status = 200) {
    const r = await request(origin + route, {redirect:'error',signal:AbortSignal.timeout(15000)});
    assert.equal(r.status,status,`Unexpected status: ${route}`);
    checks.push(route);
    return r;
  }
  const html = await (await get('/')).text();
  assert.match(html,/manifest\.webmanifest/);
  assert.equal((await (await get('/api/health/ready')).json()).status,'ready');
  const manifest = await (await get('/manifest.webmanifest')).json();
  assert.equal(manifest.display,'standalone');
  for (const size of ['192x192','512x512']) {
    const icon = manifest.icons.find(i => i.sizes === size);
    assert.ok(icon && /^\/icons\/[a-zA-Z0-9._-]+\.png$/.test(icon.src),'Expected same-origin PNG icon');
    const bytes = new Uint8Array(await (await get(icon.src)).arrayBuffer());
    assert.deepEqual([...bytes.slice(0,8)],[137,80,78,71,13,10,26,10]);
  }
  const worker = await get('/sw.js');
  assert.match(worker.headers.get('cache-control') || '',/no-store/);
  assert.match(await worker.text(),/offline\.html/);
  assert.match(await (await get('/offline.html')).text(),/offline/i);
  await get('/api/dev/mail',404);
  return {checks,certificate:'Node default trust validation; no TLS bypass',scope:'HTTP only; browser registration, ACL isolation, offline behavior and physical installation not verified'};
}
if(process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const results = await verifyDeviceHttps(process.env.DEVICE_TEST_ORIGIN);
    await fs.mkdir('.test-artifacts/device-access',{recursive:true});
    await fs.writeFile('.test-artifacts/device-access/https-results.json',JSON.stringify({at:new Date().toISOString(),...results},null,2));
    console.log(`PASS: ${results.checks.length} read-only trusted-HTTPS resource checks; physical testing not claimed`);
  } catch { console.error('Device HTTPS verification failed; check private access, trusted certificate, readiness and disabled local mail. No secrets logged.');process.exitCode=1; }
}
