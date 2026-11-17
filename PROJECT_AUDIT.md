# Project audit — 2026-11-13

The existing application is a compact Next.js 15 / React 19 / TypeScript / Prisma 6 / PostgreSQL monolith, with one client storefront containing customer, restaurant, rider and admin views. `package-lock.json` is the installation authority; package.json uses version ranges.

Fourteen route files implement authentication, catalog, orders, menu operations, restaurant availability, rider availability, assignment, admin accounts/metrics and health. The initial schema has User, Restaurant, Product, Order, OrderItem and DeliveryProfile; this pass adds idempotency metadata and order-status history through an additive migration.

## Verified findings at discovery

- The directory is not a Git repository; no clean Git baseline can be asserted.
- Dependencies are installed; Node reports v24.19.0. Earlier `RELEASE_AUDIT.md` environment findings are historical and do not describe this session.
- Four existing lifecycle unit tests passed. Baseline TypeScript compilation passed. Vitest initially hit a sandbox directory-access error and passed when run with approved elevated permissions.
- `docker` and `psql` commands were not found. No migration or seed has been executed in this session.
- Checkout used JavaScript floating-point calculations and truncated timestamp order numbers, with no idempotency protection.
- Status and assignment handlers read then updated without comparing the observed state, allowing concurrent changes to be overwritten.
- Admin revenue included unpaid, noncancelled orders.
- `.env.example` used port 5432 while Compose exposes PostgreSQL on 5433.
- Online payment, password recovery, durable login throttling, notifications, refund/settlement workflows and full tenant staff management are absent.

## Current disposition

Integrity fixes and UI refinement are under implementation. See `IMPLEMENTATION_PROGRESS.md`, `TEST_REPORT.md` and `SECURITY_REPORT.md` for current results. This audit is not a production certification. Existing local food assets have no provenance/license records in the repository; verify rights before launch.

## Continuation findings - 2026-11-13 (current)

- PostgreSQL 16 exists at C:/Program Files/PostgreSQL/16/bin, although absent from PATH. A separate disposable loopback cluster on 55439 enabled migration tests on two new databases. The configured application database on 5433 did not respond and was not changed.
- Upgrade tests preserved every legacy order field and multiple NULL idempotency keys; exercised unique key/index, order-event FK and positive cash-receipt constraints. All three migrations are up to date only in the disposable databases.
- Production forged-Origin test initially returned 404 instead of 403. Build middleware manifest was empty: root middleware.ts was not included with src/app. Moving to src/middleware.ts fixed it; the built-server regression now returns 403. Next.js convention: https://nextjs.org/docs/15/app/getting-started/route-handlers-and-middleware
- A lost checkout response followed by reload discarded the in-memory key. Added fingerprint/key session persistence and a real dropped-response/reload regression proving one order is retained.
- Delivered COD orders had no cash-receipt workflow. Added an admin-only exact-amount receipt ledger/form, unique reference/order and atomic payment update. Delivery alone remains unpaid; this is an administrative cash attestation, not a full commission/banking ledger.
- Admin registered-user metric was capped at 200; it now uses database count. Assignment controls no longer appear on PLACED orders and offer only online riders. Restaurant availability now reads the actual stored value.
- Seven axe scans initially found low-contrast captions/footer/dashboard copy. Corrected colours and reran successfully. Mobile hero text spacing corrected; local editorial images optimized with Next Image. Two dynamic product-image lint warnings remain.
- Fresh Playwright-owned Chrome contexts work without an existing tab. Bundled Chromium download failed on a sandbox cache-lock permission; installed Chrome works for all executed checks.
- Final built-server workflow: 57 assertions, seven axe scans, 18 screenshots, no browser page errors. Unit/mocked suite: 20 tests. Production build/TypeScript/Prisma/lint pass (two warnings). See TEST_REPORT.md for exact limits.
- Dependency audit started at 17 issues including two critical. Patched Vitest and compatible audit fixes leave 11 (7 moderate, 4 high). No forced framework/Prisma major upgrade was applied.

Earlier discovery statements above are historical. Current test evidence does not certify production readiness or unknown existing data. Food-photo rights remain unverified.

Payment/security continuation: test-only provider backend, durable webhook ID/body-hash deduplication, exact paise/refund state and response-loss recovery implemented with signed fixtures and mocked provider HTTP. 54 tests, 18 real localhost payment/security assertions, 57 workflow assertions and seven axe scans pass. Targeted overrides resolve all 11 advisories; optimized image source policy removes both lint warnings. Four additive migrations tested on two newly created disposable databases, no schema drift; existing 5433 remains unavailable/unchanged. Provider credentials absent, no actual sandbox call, public ONLINE checkout disabled; CI prepared but not executed remotely. See current TEST_REPORT.md, SECURITY_REPORT.md and IMPLEMENTATION_PROGRESS.md for limits.

## Release diagnostics update � 2026-11-13

The readiness endpoint now fails for missing/incomplete required migration history. db:diagnose compares applied checksums without writes and never prints database credentials. Recovery/error monitoring accepts only bounded strict metadata, requires normal same-origin protection and rate limits, hashes fingerprints server-side, and avoids raw exception messages/stacks. JSON host logging is implemented; external monitoring/alert delivery remains unverified. Missing Razorpay TEST credentials keep ONLINE disabled; no real provider transactions were attempted.
