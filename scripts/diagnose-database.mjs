// Read-only: TCP probe, SELECT 1 and migration metadata. No URL/password/error details printed.
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { createHash } from 'node:crypto';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production', { info() {}, error() { process.stderr.write('Environment configuration could not be loaded\n'); } });
const raw = process.env.DIAGNOSTIC_DATABASE_URL || process.env.DATABASE_URL;
const result = { readOnly: true, configuration: 'missing', tcp: 'not-checked', database: 'not-checked', migrations: 'not-checked', pending: [], changedChecksums: [] };
let db;
async function main() {
  if (!raw) { process.exitCode = 1; return; }
  let target;
  try { target = new URL(raw); if (!['postgresql:', 'postgres:'].includes(target.protocol)) throw Error(); }
  catch { result.configuration = 'invalid'; process.exitCode = 1; return; }
  result.configuration = 'valid';
  const port = Number(target.port || '5432');
  if (!Number.isInteger(port) || port < 1 || port > 65535) { result.configuration = 'invalid'; process.exitCode = 1; return; }
  result.tcp = await new Promise(resolve => {
    const socket = net.createConnection({ host: target.hostname, port });
    let settled = false;
    const done = value => { if (!settled) { settled = true; socket.destroy(); resolve(value); } };
    socket.setTimeout(3000, () => done('timeout'));
    socket.on('connect', () => done('reachable'));
    socket.on('error', error => done(error.code === 'ECONNREFUSED' ? 'refused' : error.code === 'ENOTFOUND' ? 'dns-failed' : 'unreachable'));
  });
  if (result.tcp !== 'reachable') { result.database = 'unreachable'; process.exitCode = 1; return; }
  target.searchParams.set('connect_timeout', '3'); target.searchParams.set('pool_timeout', '3');
  db = new PrismaClient({ datasourceUrl: target.toString(), log: [] });
  try { await db.$queryRaw`SELECT 1`; result.database = 'connected'; }
  catch (error) {
    const code = error.code || error.errorCode;
    result.database = ({ P1000: 'authentication-failed', P1003: 'database-missing', P1010: 'access-denied' })[code] || 'connection-failed';
    result.errorCode = typeof code === 'string' && /^P[0-9]{4}$/.test(code) ? code : 'unclassified';
    process.exitCode = 1; return;
  }
  let rows;
  try { rows = await db.$queryRaw`SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"`; }
  catch { result.migrations = 'history-missing-or-unreadable'; process.exitCode = 1; return; }
  const active = rows.filter(row => !row.rolled_back_at);
  const dirs = (await fs.readdir('prisma/migrations', { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  for (const name of dirs) {
    const applied = active.find(row => row.migration_name === name && row.finished_at);
    if (!applied) result.pending.push(name);
    else {
      const sql = await fs.readFile(path.join('prisma/migrations', name, 'migration.sql'));
      if (createHash('sha256').update(sql).digest('hex') !== applied.checksum) result.changedChecksums.push(name);
    }
  }
  const unknown = active.filter(row => !dirs.includes(row.migration_name));
  result.migrations = active.some(row => !row.finished_at) ? 'failed-or-in-progress' : result.changedChecksums.length ? 'checksum-mismatch' : unknown.length ? 'database-ahead-or-diverged' : result.pending.length ? 'pending' : 'ready';
  if (result.migrations !== 'ready') process.exitCode = 1;
}
main().catch(() => { result.database = 'diagnostic-failed'; process.exitCode = 1; }).finally(async () => { await db?.$disconnect(); console.log(JSON.stringify(result)); });
