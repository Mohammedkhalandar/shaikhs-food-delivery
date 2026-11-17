import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deviceAccessConfig} from './prepare-device-access.mjs';
import {validateRuntime} from './validate-runtime.mjs';

test('USB configuration binds loopback and forwards only to loopback application', () => {
  const text = deviceAccessConfig('localhost', '.test-artifacts/device-access');
  assert.match(text, /bind 127\.0\.0\.1/);
  assert.match(text, /reverse_proxy 127\.0\.0\.1:3100/);
  assert.match(text, /admin off/);
  assert.match(text, /respond @blocked 404/);
  assert.doesNotMatch(text, /55440|DATABASE_URL|log\s*\{/);
});
test('LAN configurations bind only the selected private address', () => {
  for (const ip of ['10.2.3.4','172.16.1.2','172.31.255.3','192.168.1.20']) {
    assert.ok(deviceAccessConfig(ip, '.test-artifacts/device-access').includes(`bind ${ip}\n`));
  }
});
test('reject public, wildcard, malformed and injected hosts', () => {
  for (const ip of ['0.0.0.0','8.8.8.8','172.32.0.1','192.168.256.1','::','example.com','localhost\n:80','127.0.0.1']) {
    assert.throws(() => deviceAccessConfig(ip, '.test-artifacts/device-access'));
  }
});
test('reject certificate path configuration injection', () => {
  assert.throws(() => deviceAccessConfig('localhost', 'bad\npath'));
});
test('documented HTTPS profiles retain local-mail and provider safety gates', () => {
  const env = {DATABASE_URL:'postgresql://fixture:fixture@127.0.0.1:55440/shaikhs_disposable_fixture',APP_URL:'https://localhost:8443',JWT_SECRET:'fixture-only-not-used-for-authentication-12345',MAIL_DELIVERY_MODE:'local',DEV_MAIL_KEY:'a'.repeat(64),RAZORPAY_SANDBOX_VERIFIED:'false',EXTERNAL_PAYOUTS_ENABLED:'false'};
  assert.equal(validateRuntime(env).ok,true);
  assert.ok(validateRuntime({...env,APP_URL:'https://192.168.1.20:8443'}).errors.includes('LOCAL_MAIL_GUARD'));
  assert.equal(validateRuntime({...env,APP_URL:'https://192.168.1.20:8443',MAIL_DELIVERY_MODE:'disabled'}).ok,true);
  assert.equal(validateRuntime({...env,RAZORPAY_SANDBOX_VERIFIED:'true'}).ok,false);
  assert.equal(validateRuntime({...env,EXTERNAL_PAYOUTS_ENABLED:'true'}).ok,false);
});
