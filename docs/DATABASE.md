# Database

PostgreSQL through Prisma 6. `prisma/schema.prisma` and committed SQL migrations are authoritative. The initial migration defines six models; the additive integrity migration introduces checkout metadata and OrderStatusEvent.

| Model | Purpose / constraints |
| --- | --- |
| User | Unique email/optional phone; role and active flag; password hash |
| Restaurant | Unique owner; products/orders; current open flag |
| Product | Restaurant-owned; category string; availability; Decimal(10,2) price; restaurant/availability index |
| Order | Unique order number; customer/restaurant/optional rider; exact totals; state/payment fields; customer/date and operational state indexes |
| OrderItem | Product reference and immutable name/price snapshot; quantity and exact line total |
| DeliveryProfile | Unique user; online flag and vehicle |
| OrderStatusEvent | Order, status, actor ID snapshot and time; order/time index |

Order has nullable idempotencyKey/requestHash and a unique (customerId, idempotencyKey) index. Null metadata preserves existing rows. Actor IDs in status events are snapshots, not a user foreign key. Existing orders are not given fabricated history.

Checkout uses a database transaction, current availability/price reads and Decimal calculations; status/event updates must commit together. Row/unique conflicts must be returned as retryable errors, not overwritten. Financial display conversion must never become authoritative arithmetic.

Not modeled yet: saved addresses, category entities, staff memberships, variants/add-ons, payment event/settlement/refund ledgers, zones, promotions, reviews and a general audit log. Do not imply these exist.

Apply committed migrations with `npm run db:deploy`; author with `npm run db:migrate` only in development. Review SQL on a disposable database and backup before release. Never reset or delete user data without approval. No migrations were applied during documentation creation.

## COD receipt ledger addition

Migration 202611130002_cod_settlement adds CodSettlement with a unique orderId, unique reference, Decimal(10,2) amount with SQL CHECK amount > 0, receiving admin identifier snapshot and createdAt. Order FK uses RESTRICT deletion to retain receipt linkage. The handler checks exact order total and delivered/PENDING/COD prerequisites, then records receipt and PAID status in one transaction. Admin actor IDs are snapshots; this is not a complete immutable general ledger or bank reconciliation.

Both additive migrations were applied and regression-tested only on two new disposable databases. Configured application database port 5433 was unavailable and unchanged. Existing data must be reviewed and backed up before any authorized migration.

## Payment migration and checks

Migration 202611130003_payment_security adds five tables without rewriting existing order data. OnlinePayment has a unique orderId/provider order/provider payment, bounded positive BIGINT paise and CHECK-constrained lifecycle strings. PaymentRefund has one full-refund record per payment and unique provider refund ID. PaymentEvent has a unique event ID and unique raw-body hash; it stores metadata/outcome only. PaymentAudit snapshots actor/action/time; RateLimitBucket has atomic fixed-window hits and indexed expiry. FKs retain financial receipt records on order deletion.

Both new disposable databases passed the upgrade; four migrations are up to date there. Current application database is unchanged. Unknown existing data, backups and a restore drill still require staging review. Review flags exclude ambiguous balances from verified revenue; this is not a complete general ledger or commission/bank settlement system.

Operations migration 202611130004_operations adds nullable schedules, pause/prep/handoff/issue fields, version counters, status notes and an indexed operational history table. Checks constrain prep minutes, six-digit codes and issue kinds. Legacy field hashes/counts were compared before/after the isolated development upgrade; existing original database was not migrated. Existing records default to manual kitchen availability, no issues and pending rider acceptance. Already-picked-up assignments can request an audited delivery verification code; all new handoffs require independent kitchen/customer verification.

Migration 202611130005_staff_menu_earnings adds staff/invitation, category/option/image, delivery-policy and rider earnings/settlement tables, archival/version fields and checkout snapshots. It preserves original order/product fields. Legacy product categories gain normalized IDs; already completed assigned deliveries gain an initial INR 25 earning under policy version 0, pending until payment/cash reconciliation. This explicitly declared development policy/backfill must be reviewed before any separately approved production migration. Existing historical prices are not rewritten. Images are bounded normalized bytes in PostgreSQL; archives retain referenced data. Only the approved isolated database was upgraded; original databases/configuration remain untouched.

Migration 202611130006_addresses_zones adds CustomerAddress and DeliveryZone, unique active-default and active-priority partial indexes, version/archive fields and nullable Order delivery snapshots/legacy retry metadata. Existing order/item field hashes and user/product/restaurant counts were verified unchanged on the approved isolated upgrade. No existing address or fee was backfilled or rewritten, and the migration invents no coverage. A separately labelled disposable demo PIN fixture (584101) keeps the existing demo usable; it is not a claim of real geographic serviceability. Real restaurant areas must be configured by admin. Seven migration checksums and read-only Prisma schema comparison pass. Partial indexes remain migration-managed constraints; never reset/recreate original databases.

Recovery/notifications migration 202611130007_recovery_notifications adds User.authVersion plus PasswordResetToken, EmailOutbox and Notification tables only. Existing accounts default to session version zero; no password/order/payment field is rewritten and no historical notification is fabricated. Reset hash and per-recipient event-key uniqueness, lookup indexes, cascading user/order relations, outbox state/attempt limits and nonnegative session versions are database-enforced. Approved isolated database identity and preexisting user/order/item hashes/counts were checked before/after deploy; fresh disposable legacy-upgrade and read-only drift checks passed. Local outbox bodies require a separate protected encryption key, never a browser-exposed secret.
