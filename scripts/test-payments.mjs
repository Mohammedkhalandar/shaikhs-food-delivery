import { spawnSync } from 'node:child_process';
if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required; refusing to report skipped payment checks as success');
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'tests/payments.integration.test.ts'], { stdio: 'inherit', env: process.env });
process.exitCode = result.status ?? 1;
