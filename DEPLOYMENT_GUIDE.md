# Deployment and recovery runbook

Status: locally verified release candidate, not publicly deployed. ONLINE payments and external payouts stay disabled. No command below authorizes modifying an existing/production database. Record the client's approved target identity, release, maintenance window and incident owner before a deployment.

## Prerequisites and release gates

Use Node 24 LTS, the committed lockfile and PostgreSQL 16 client/server tools. Native tools: set PG_BIN to the PostgreSQL 16 bin directory. Docker transport is for the known local development container only; PG_TOOL_DOCKER_CONTAINER and PG_DOCKER_BIN select that existing container/client without creating containers or volumes. Do not run the legacy Compose template against the approved isolated volume; its source-only hardening does not change running resources.

Run npm ci, npm test with a disposable TEST_DATABASE_URL, npm run lint, npm run typecheck, npx prisma validate, npm audit --audit-level=moderate and npm run build. CI requires these plus actual backup/restore and production-startup tests. Remote CI has not been executed by this local drill. Build one immutable release artifact including public assets and prisma/migrations; never ship .env, .test-artifacts or .backups. Menu image bytes live in PostgreSQL and are included in backups; external image sources are not owned backup assets.

Set DATABASE_URL, a unique JWT_SECRET (32+ random characters) and canonical HTTPS APP_URL in the client secret environment. Use least-privilege runtime access and separate approved migration/backup authority; use verified TLS for remote database connections. DIRECT_URL is not read by this Prisma schema. Keep RAZORPAY_TEST_ENABLED=false, RAZORPAY_SANDBOX_VERIFIED=false, EXTERNAL_PAYOUTS_ENABLED=false and MAIL_DELIVERY_MODE=disabled. Production startup rejects invalid settings and payment/payout activation; HTTP APP_URL is allowed only for loopback disposable development databases. Never run the demo seed on a client database.

## Back up and rehearse restoration

Use private, access-controlled encrypted storage. PostgreSQL custom archives are compressed, NOT encrypted. They contain customer data, password hashes and sensitive history. BACKUP_SIGNING_KEY is a separate 32-byte hex operator secret, held outside the backup store and normal web runtime. Protect and escrow it separately; it authenticates the manifest, not encrypts the archive. Store application/mail secrets and role/grant provisioning separately. Windows DPAPI key files alone cannot be recovered on another machine/user.

Development PowerShell (existing approved database only):

```powershell
. .\.test-artifacts\use-isolated.ps1
. .\scripts\use-backup-key.ps1
$backupMeta = Get-Content .test-artifacts/isolated-db.json | ConvertFrom-Json
$env:PG_TOOL_DOCKER_CONTAINER = $backupMeta.container
# Set PG_DOCKER_BIN to the installed Docker executable if it is not on PATH.
npm run db:backup
# Use the exact newly reported archive path; keep its signed .json manifest with it.
npm run db:restore -- ".backups\YOUR_NEW_ARCHIVE.dump"
npm run test:backup-restore
```

For a separately approved native backup, set DATABASE_URL and BACKUP_EXPECT_DATABASE explicitly, plus BACKUP_SIGNING_KEY/PG_BIN. Backup uses a read-only exported RepeatableRead snapshot shared with pg_dump. It signs the archive hash, endpoint identity and all-table fingerprints. No source writes occur.

Restore requires explicit RESTORE_ADMIN_URL on loopback and creates a uniquely named shaikhs_disposable_restore_* database from template0. Existing database names are refused, including earlier restore targets. Only the verified NEW empty target's default public schema is removed so pg_restore can recreate it; no CASCADE/clean/reset is used. Restore is single-transaction, stops on errors, checks matching tool/server major versions and compares every row/column plus column types/defaults, enum/sequence metadata, indexes, constraints, triggers and functions. Equivalent PostgreSQL CHECK conjunction grouping is canonicalized. Failed new targets/archives are retained for diagnosis; there is no automatic deletion.

A backup without its authenticated manifest is not accepted. Corruption/tampering is rejected before restore. Only restore trusted signed archives. Cross-major upgrades need a separate staged acceptance procedure; this tool deliberately refuses them. Actual production restore is a separately approved operator action; this tool intentionally cannot overwrite or restore directly into a client database.

## Migration preflight and rollout

1. Quiesce all writers and background workers. A logical snapshot does not include later transactions. Define client-approved RPO/RTO, encrypted off-site retention and PostgreSQL WAL/PITR before claiming production disaster recovery or zero data loss.
2. Take a fresh backup and complete a restore rehearsal. Set BACKUP_FILE to the exact archive and run npm run db:preflight. It performs no writes, verifies signature/hash/endpoint/freshness/current data, checks migration history/checksums and lists pending migrations. Exit 0 = ready, 2 = pending migrations require review/approval, 1 = unsafe/unavailable. Destructive-token flags are advisory, not a complete SQL safety analysis.
3. Review every pending SQL migration and test it against a NEW restored staging database. Obtain explicit approval before npm run db:deploy against any existing database. Never reset/db push or edit applied migration files. A first installation into a separately verified NEW empty client database needs initial-schema review/approval; the existing-data backup preflight is for upgrades.
4. After approval, apply migrations as a controlled release step, run read-only db:diagnose, then start the built release with npm start -- -H 127.0.0.1 -p 3000 behind the approved HTTPS proxy/process supervisor. Startup never migrates or seeds. Use /api/health for liveness and /api/health/ready for database/schema readiness. Route traffic only after ready=200; unavailable databases return sanitized 503.
5. Validate authenticated cross-role COD ordering, financial receipts, permissions and duplicate retries on staging. Set up trusted proxy/HTTPS, backups, incident alerts and log retention before accepting customers. Existing structured reporting logs allowlisted codes/hashes/references, never raw request bodies/secrets. No remote alert receiver is claimed configured.

## Rollback or incident recovery

Stop/drain writes; preserve the failed release, current database and logs. Prefer rolling code back only when it is compatible with retained additive schema; do not run down migrations or delete financial/audit records. Restore the signed last-good backup into a NEW recovery database, verify fingerprints/schema/app readiness, then reconcile all transactions after the snapshot (orders, COD receipts, settlements and any provider events) before an approved traffic/connection cutover. Use reviewed WAL/PITR where required; blindly switching to a stale snapshot can duplicate payouts or lose orders. Keep original databases/volumes intact until separately approved retention/disposal. Do not rewrite .env or repoint traffic automatically.

## Remaining functional stage

Admin restaurant/account onboarding and activation controls are implemented. Next product priority: quantity stock, followed by operator review-case resolution. External email/account verification and optional PWA remain separate work; no new infrastructure/product work was started after this milestone.

Customer verification release gate: public registration now produces pending accounts and new checkout fails closed until email proof. Existing accounts retain explicit legacy access with emailVerifiedAt=null rather than fabricated verification. Local acceptance uses the existing encrypted development outbox and operator-only CLI; HTTP exposes metadata only. No external provider is configured or enabled by this milestone. A future public client deployment must explicitly approve legacy-account policy and configure/accept an external mail adapter before opening new-customer ordering; never remove server verification checks to bypass missing delivery. New email changes require password and proof before switching and revoke sessions/reset links. Fourteen-migration readiness is required by startup.
## PWA release assets

Ship public/manifest.webmanifest, public/sw.js, public/offline.html and public/icons together with the built release. Keep manifest/icon links in the actual document head: streamed body metadata was not discovered by Chrome. Serve sw.js with no-store and root Service-Worker-Allowed; use HTTPS outside the approved loopback development environment. Bump the worker VERSION whenever precached assets change. Updates must never force a reload during checkout. The cache is public-only; do not add API/navigation/account/payment/financial responses or RSC to it. Run `npm run test:pwa-catalog` against an explicitly verified disposable database and production build; this does not prove physical Android/iOS installation. No public deployment or database exposure is authorized by these instructions.

## Repeatable local performance acceptance

Use the already verified isolated development database and production build; never run this against client/production data. Load protected configuration with .test-artifacts/use-isolated.ps1 and scripts/use-local-mail.ps1, then start the production server on loopback port 3100. Do not print secrets or change disabled provider flags.

Install optional lab tools into ignored storage only (root dependencies/lockfile unchanged):

```powershell
npm install --prefix .test-artifacts/performance-tools --no-save --package-lock=false --ignore-scripts lighthouse@13.6.0 web-vitals@6.2.3
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.test-artifacts/playwright-browsers'
node node_modules/playwright/cli.js install chromium
# Resolve the installed isolated chrome-headless-shell executable; do not use a modified system Chrome.
$env:PERFORMANCE_CHROME_PATH = (Get-ChildItem .test-artifacts/playwright-browsers -Filter chrome-headless-shell.exe -Recurse | Select-Object -First 1).FullName
$env:PERFORMANCE_RUNS = '3'
$env:PERFORMANCE_INTERACTION_RUNS = '3'
npm run test:performance
npm run test:low-network
```

Node >=22.19 is required by the optional Lighthouse tool (verified with Node 24.19). Warm the local application/image cache, avoid competing suites, preserve every raw report including outliers, and record browser/CPU/network conditions. The runner records fresh-context mobile/desktop Lighthouse and observed Web Vitals separately; TBT is not INP. See FINAL_ACCEPTANCE_REPORT.md for the accepted conditions/results. Reject host-injected third-party scripts rather than modifying host security software. Stop only the test server you started; retain PostgreSQL and all existing resources.

These checks do not establish field p75, physical installation or production readiness. Physical Android/iOS installation and standalone/offline acceptance need actual devices. Current schema readiness is fifteen migrations; older fourteen-migration notes above are historical. Stock, operator cases, email verification and PWA are already implemented; the earlier remaining-functional-stage list is historical. External messaging/payment/payout gates remain disabled.
