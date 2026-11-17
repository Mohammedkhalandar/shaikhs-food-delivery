# Security report — 2026-11-13

This is a source review and targeted engineering pass, not a penetration test or production-readiness approval.

## Existing controls

- bcrypt password hashing (cost 12); customer-only public registration.
- HS256 signed, seven-day HTTP-only sessions; Secure cookies in production and SameSite=Lax. Database role/active status is reread per authenticated request.
- Same-origin checks on mutating API requests; production requests require Origin.
- Server role and owner/assignment checks on protected operations; server-side catalog price lookup.
- Zod validation on core bodies; no card credentials are stored. ONLINE checkout is rejected.
- Security headers in next.config.ts and a production guard on demo seeding.

## Fixes being verified

Decimal checkout arithmetic, collision-resistant identifiers, idempotent order creation, atomic state progression, history and paid-only reporting. See source and test report for exact verification status.

## Unresolved launch risks

No durable authentication/API rate limiting, password recovery or email/phone verification. Logout removes the browser cookie but does not centrally revoke a copied token. No complete security event log, upload pipeline, content security policy, account administration workflow or retention tooling. Error handling is inconsistent across existing endpoints. Remote product-image URL policy and food-image provenance need review. Payment gateway, refunds and COD settlement accounting are absent; delivery status alone is not independent proof of cash settlement.

Production requires HTTPS, unique secrets, trusted APP_URL/proxy configuration, database least privilege, backups/restore testing, dependency advisory review, tenant-isolation tests and operational monitoring. Do not expose local demo accounts. Do not connect credentials or customer data to untrusted tooling.

## Continuation security verification

Fixed and verified: active origin middleware in src/middleware.ts, production forged-Origin rejection, atomic checkout/status/receipt handling, exact financial arithmetic, scoped order visibility and role checks. A real lost-response/reload browser regression proves stable checkout replay. COD receipt writes are admin-only and audit receivedById/reference/amount/time; delivery alone does not set PAID. This is not a full security audit or independent cash verification.

The old root middleware was not included in the built src/app project. An empty build manifest and a production request reproducing the bypass were checked before moving it. Three new unit tests and the final production workflow cover origin protection. Signed webhooks will need a separately authenticated, narrowly scoped origin exemption when implemented; do not exempt ordinary cookie-authenticated APIs.

Dependency audit: critical test-tool vulnerabilities removed by Vitest 4.1.12. Remaining npm audit result is 11 (7 moderate, 4 high), including Prisma/config deepmerge-ts, Next/PostCSS and lint-tool minimatch chains. Compatible audit fixes did not clear them; no forced Next/Prisma major upgrade was attempted. Review targeted patched dependency paths in a separate tested change before release.

Previous statements that COD receipt accounting is absent are superseded by the new basic receipt ledger. Full rider settlements, commissions, refunds and banking reconciliation remain absent. Existing database migration and backup tests, durable rate limiting, recovery/revocation, full event auditing, image-policy/provenance, CSP and operational monitoring remain launch blockers.

## Payment/security release checkpoint

The test-only payment backend is implemented, but no external Razorpay sandbox or live transaction was performed. Local .env/process configuration exposed no Razorpay variable names; no secret values were printed. ONLINE public checkout is still disabled. The exact HMAC webhook POST is the only CSRF exemption; all cookie-authenticated payment writes remain origin-protected.

Verified controls: raw streamed body limits, timing-safe signatures, test-key-only fixed HTTPS provider origin and redirect refusal, exact amount/order/INR matching, owner/admin isolation, captured-only credit, ID+body-hash replay protection, transaction rollback, monotonic refund state, unique provider IDs, durable idempotent full refunds, safe uncertain-order recovery, metadata-only financial audit, rate limits shared in PostgreSQL, bcrypt UTF-8 byte cap/dummy hashing, HS256-only JWT verification and strict image host policy. No raw webhook payload, card details, addresses, provider secrets or auth tokens are logged/stored in the payment event table.

### Dependency audit disposition (all eleven previous package findings)

| Package/path | Previous severity | Exposure and targeted fix |
| --- | --- | --- |
| next -> postcss | moderate | Wrapper finding for build-time PostCSS. Next 15 retained; scoped PostCSS 8.5.32 override. |
| postcss | high | CSS/source-map file-read/XSS findings; app has no user-authored CSS ingestion. Patched same-major parser; production build/browser checks pass. |
| prisma -> @prisma/config | high | Wrapper for merge helper; developer-controlled configuration, not a public merge API. Prisma 6 retained. |
| @prisma/config -> deepmerge-ts | high | Same configuration chain; scoped helper override. Generate/validate/migrate/diff and PostgreSQL checks exercise the installed CLI. |
| deepmerge-ts | high | Recursive graph exhaustion. Patched 8.0.2 after reviewing retained deepmerge export and Map/type changes; project config uses plain objects. |
| @typescript-eslint/eslint-plugin -> type-utils/utils | moderate | Development lint chain; no remote glob inputs. Fixed through parser dependency override. |
| @typescript-eslint/parser -> typescript-estree | moderate | Same lint chain, including nested estree installation. Fixed through scoped minimatch override. |
| @typescript-eslint/type-utils -> estree/utils | moderate | Same development-only inherited advisory, resolved. |
| @typescript-eslint/typescript-estree -> minimatch | moderate | Both nested parser/estree and top-level estree paths resolved to patched matcher. |
| @typescript-eslint/utils -> estree | moderate | Same inherited advisory, resolved. |
| minimatch (two estree dependency paths) | moderate | Glob amplification requires attacker-controlled developer patterns; override 11.0.7 after checking the consumer uses only retained minimatch() API, not removed AST/makeRe. Clean lint/typecheck passes. |

Final npm audit JSON: 0 low/moderate/high/critical findings. Reports are retained in .test-artifacts/dependency-audit-{before,after}.json. This is not proof of absence of vulnerabilities. Exact overrides need compatibility review on upgrades; Node >=22.12 is required. No blind Next/Prisma major upgrade or advisory suppression was used.

Remaining release risks: actual provider sandbox/SDK/webhook delivery acceptance, operational handling of partial/extra/late-payment review cases, scheduled reconciliation and expired-counter cleanup, upstream abuse/DDoS controls, copied-token revocation/recovery/verification, CSP and external monitoring, backups/restore drill, image rights and broader device/load/security review. Rate-limit global caps can be exhausted by attackers; they are not a substitute for upstream controls. Raw upload endpoints do not exist. No public deployment, real payment or existing database mutation occurred.

Unresolved provider creation is surfaced in review metrics; verified receipt recovery clears its creation-only flag. Unbound terminal states refuse recursive recovery. Pending/failed refund obligations are visible even when the order was not cancelled. These guards passed the focused PostgreSQL suite.

## Checkout security additions

Public ONLINE creation now requires both valid TEST configuration and explicit server-side sandbox attestation; identical prior order replay remains available when disabled. Config endpoint returns no key/secret. Owner/admin status endpoint is no-store and uses existing auth/rate limits. SDK configuration is restricted to a test public key, server paise/order and fixed HTTPS script URL. Callback forwards only payment/order IDs and signature; only backend evidence confirms capture. Pending provider authorizations block reopening, reloads retain the same intent/key/method, duplicate callbacks are locked and supported browsers use cross-tab Web Locks. Provider idempotency and webhook uniqueness remain essential across unsupported browsers/devices. Actual gateway behavior is not proven by mocks.

## Error telemetry hardening � 2026-11-13

Client telemetry accepts only area and optional SHA-256 digest; server hashes that digest again before JSON logging. Unknown fields, oversized bodies and cross-origin writes are rejected. Database-backed throttling has a bounded outage fallback; per-area server sampling prevents unbounded logging. Generated references contain no request data. Raw messages/stacks, URLs, secrets and customer data are excluded. External alerting and log retention require operator configuration; per-process fallback limits are not a distributed replacement during outages.
