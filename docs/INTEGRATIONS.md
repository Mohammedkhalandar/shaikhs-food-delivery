# Integrations

| Service | Current implementation |
| --- | --- |
| PostgreSQL | Prisma datasource via DATABASE_URL |
| COD | Checkout method and payment status fields; full settlement ledger remains absent |
| Razorpay | Test-key-only backend, signed callbacks/webhooks, durable deduplication, reconciliation and full-refund state; provider sandbox unverified; normal ONLINE checkout still returns 422 |
| Maps / GPS | No live tracking integration |
| Email / SMS / WhatsApp | Not configured |
| Image storage | Local public sample assets and product image URLs; no upload provider |
| Monitoring / analytics | No external provider configured |

Environment: DATABASE_URL, JWT_SECRET, APP_URL; optional RAZORPAY_TEST_ENABLED, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET and MENU_IMAGE_HOSTS. See .env.example. Payments default disabled; only rzp_test_ keys are accepted, and webhook secret must have at least 32 characters. No Razorpay variables were present in the inspected local configuration. No real provider request was executed.

Backend acceptance uses signed fixtures and mocked provider HTTP against disposable PostgreSQL. Customer ONLINE/SDK UI is implemented but gated by configured test credentials and RAZORPAY_SANDBOX_VERIFIED=true after actual sandbox acceptance. Tests create clearly synthetic ONLINE orders directly in disposable fixtures; do not treat this as a customer-facing online-payment launch.

## Implemented payment boundary

- Server order creation uses the stored order total converted exactly to integer paise; one OnlinePayment per order. Provider origin is fixed HTTPS, redirects refused, 10-second timeout. After ambiguous creation, retries search the durable receipt and never blindly POST a second order. Zero/multiple receipt matches require operator investigation.
- Callback HMAC binds the server-stored provider order ID to the payment ID. A valid signature alone cannot mark PAID: authoritative provider entity must match order/amount/INR and be captured. See [Razorpay integration](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/).
- Webhook checks bounded raw bytes with its distinct secret. Unique event ID and body hash are stored atomically with financial updates; failure rolls everything back for provider retry. Completed refund replays are acknowledged even during a provider outage. Only the exact webhook POST is exempt from browser Origin checks. See [webhook validation](https://razorpay.com/docs/webhooks/validate-test/).
- Full refunds reserve one durable receipt before calling the provider, reuse its X-Refund-Idempotency key, and mark REFUNDED only on processed state. Pending/failed refunds retain captured money. Created events can already be processed; full auto-refunds of uncaptured attempts never credit revenue. See [idempotent refunds](https://github.com/razorpay/markdown-docs/blob/master/api/refunds/normal-refunds-idempotent.md) and [refund payloads](https://github.com/razorpay/markdown-docs/blob/master/webhooks/refunds.md).
- Reconcile is owner/admin authenticated, recovers missing provider order bindings, fetches payments/refunds and expires abandoned attempts after 30 minutes when invoked. It is not a scheduled worker. Late captures retain cancellation and flag manual review; partial refunds/additional captures require manual review and are excluded from verified revenue. Paid cancellations are surfaced as refund obligations.
- Image optimization uses local images or explicit HTTPS MENU_IMAGE_HOSTS; unconfigured remote sources are rejected/hidden. Rebuild when changing hosts. No unrestricted proxy or upload service was added.

Before enabling any customer online flow: obtain test credentials, exercise actual sandbox orders/captures/refunds/retries, configure HTTPS test webhooks, validate event schemas and retry recovery, add Checkout UI, and establish review/expiry/monitoring operations. Single active webhook secret is supported; plan rotation around outstanding retries. Live keys and real-money operations remain forbidden in this implementation.

Add providers through small server-side interfaces with validated configuration and meaningful failure states. Background delivery/retries must be durable before claiming reliable notifications. Food-image license/provenance must be documented before production use.


Customer Checkout integration is complete locally. Exact credentials, webhook settings and pre-gate operator acceptance steps: [RAZORPAY_SANDBOX.md](RAZORPAY_SANDBOX.md). No private credential reaches the frontend. The browser loads only the fixed official SDK URL after the gate is checked; retries reuse and reconcile the saved order, and pending authorizations block reopening.
