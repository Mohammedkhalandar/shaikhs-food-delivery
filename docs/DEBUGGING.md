# Debugging

Reproduce → inspect related code/logs → identify cause → make a small fix → add meaningful regression coverage → rerun affected checks → update test/progress reports.

- Database unavailable: verify PostgreSQL is running, DATABASE_URL is correct and migrations are applied. Compose exposes port 5433. Health endpoint is liveness only and cannot confirm database availability.
- Prisma missing fields/types: run `npm run db:generate` after schema changes, then typecheck. Apply reviewed migrations before running new queries.
- Origin 403: APP_URL must match browser scheme/host/port. Production scripts must include an allowed Origin for writes and valid authentication.
- Checkout 400: validate quantities/address and Idempotency-Key. On uncertain network failure retain the same key and unchanged request. A different request with the same key must conflict.
- State 409: refresh the order; another operator may have advanced it. Never bypass lifecycle rules to silence a conflict.
- Sign-in failure: verify account activity and environment configuration without printing hashes, passwords, tokens or `.env`.
- Browser issues: inspect console/network and reproduce at affected viewport; distinguish server data errors from layout defects.

Checkout logs use a minimal failure marker; full structured correlation IDs, payment tracing and monitoring are not implemented. Avoid empty catches that conceal operational failures, and keep public error responses free of internal database details.
