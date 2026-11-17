import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deviceOrigin,verifyDeviceHttps} from './verify-device-https.mjs';
test('only plain trusted HTTPS test origins are accepted',()=>{
  assert.equal(deviceOrigin('https://test-node.example-tail.ts.net'),'https://test-node.example-tail.ts.net');
  assert.equal(deviceOrigin('https://localhost:8443'),'https://localhost:8443');
  for(const v of ['http://localhost:8443','https://public.example','https://a:b@node.tail.ts.net','https://node.tail.ts.net/?token=private','https://node.tail.ts.net/path','https://node.tail.ts.net.evil.example'])assert.throws(()=>deviceOrigin(v));
});
const png=new Uint8Array([137,80,78,71,13,10,26,10]);
function response(url, overrides={}) {
  const p=new URL(url).pathname;
  const bodies={'/':'<link rel="manifest" href="/manifest.webmanifest">','/api/health/ready':JSON.stringify({status:'ready'}),'/manifest.webmanifest':JSON.stringify({display:'standalone',icons:[{sizes:'192x192',src:'/icons/a.png'},{sizes:'512x512',src:'/icons/b.png'}]}),'/sw.js':'offline.html','/offline.html':'Offline','/api/dev/mail':'Not found'};
  return new Response(overrides[p] ?? (p.startsWith('/icons/')?png:bodies[p]),{status:p==='/api/dev/mail'?404:200,headers:{'cache-control':'no-store'}});
}
test('all resource checks are read-only, bounded and never follow redirects',async()=>{
  const r=await verifyDeviceHttps('https://localhost:8443',async(u,o)=>{assert.equal(o.redirect,'error');assert.equal(o.method,undefined);assert.equal(o.headers,undefined);assert.ok(o.signal);return response(u);});
  assert.equal(r.checks.length,8);
});
test('unready application and non-image icons fail acceptance',async()=>{
  await assert.rejects(()=>verifyDeviceHttps('https://localhost:8443',async u=>response(u,{'/api/health/ready':'{"status":"unavailable"}'})));
  await assert.rejects(()=>verifyDeviceHttps('https://localhost:8443',async u=>response(u,{'/icons/a.png':'not a PNG'})));
});
