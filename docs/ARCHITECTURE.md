# Architecture

## Current system

Next.js App Router serves a React client storefront and same-origin JSON route handlers. `src/components/storefront.tsx` contains customer and operational views. `src/lib/auth.ts` handles sessions; shared order/checkout rules live in `src/lib`. A singleton Prisma client accesses PostgreSQL. Keep this modular monolith; current scale does not justify microservices, Redis or a queue.

Flow: browser → route validation → current database user → role/tenant authorization → Prisma transaction → JSON → UI feedback. Signed cookie subject identifies the user; token claims do not replace current database role/active checks.

## Domains and boundaries

Authentication, catalog/menu, checkout/orders, restaurant operations, delivery and admin reporting are separate API areas. Orders snapshot product name/unit price. Money uses exact Decimal values. Customer-scoped idempotency and request hashing bind checkout retries to intent. Order progression must use a conditional update and write an event in the same transaction. Assignment must reject incompatible state/concurrent changes.

## Lifecycle

PLACED → ACCEPTED → PREPARING → READY_FOR_PICKUP → PICKED_UP → DELIVERED. Cancellation is allowed from PLACED, ACCEPTED or PREPARING. COD starts PENDING. ONLINE is not operational; payment/refund states in the schema do not constitute a payment integration.

## Operational tradeoffs

The client fetches APIs; no shared server cache or background worker is configured. Never cache authenticated/private responses in a service worker. Health is process liveness only. Error handling is per-route and needs further standardization. Notifications/payment reconciliation may justify durable jobs later, with retry and deduplication rules designed alongside the integration.

Deployment is a Next.js runtime plus managed PostgreSQL. Scale stateless app instances only after connection-pool, rate-limit and session/observability review. No provider topology is deployed by this pass. See `DATABASE.md`, `AUTH.md` and `DEPLOYMENT_GUIDE.md`.
