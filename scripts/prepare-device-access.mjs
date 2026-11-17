// Prepare only: never start listeners, change firewall rules or read application secrets.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export function deviceAccessConfig(host, directory) {
  const octets = host.split('.').map(Number);
  const ipv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) && octets.every(n => n >= 0 && n <= 255);
  const privateAddress = ipv4 && (octets[0] === 10 || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168));
  if (host !== 'localhost' && !privateAddress) throw new Error('Use localhost or an explicit RFC1918 LAN IPv4 address');
  const file = name => {
    const value = path.resolve(directory, name).replaceAll('\\', '/');
    if (/[\r\n"{}]/.test(value)) throw new Error('Unsupported certificate directory');
    return `"${value}"`;
  };
  return `# Prepared only; requires trusted device certificate and operator-started Caddy.\n{\n  admin off\n  auto_https off\n}\nhttps://${host}:8443 {\n  bind ${host === 'localhost' ? '127.0.0.1' : host}\n  tls ${file('device.pem')} ${file('device-key.pem')}\n  @blocked path /api/dev/* /api/webhooks/*\n  respond @blocked 404\n  reverse_proxy 127.0.0.1:3100\n}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const directory = path.resolve('.test-artifacts/device-access');
  const config = deviceAccessConfig(process.argv[2] || 'localhost', directory);
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(path.join(directory, 'Caddyfile'), config, {flag: 'wx'});
  console.log('Prepared .test-artifacts/device-access/Caddyfile; no listener or firewall change. See DEVICE_ACCEPTANCE_REPORT.md.');
}
