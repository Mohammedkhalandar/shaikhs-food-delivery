# Feature inventory

## Present in source

- Verified reconciled-purchase restaurant/item reviews, approved-only ratings, admin moderation, bounded author edits/withdrawal and non-censoring tenant flags with immutable audit.
- Owner/admin scheduled promotion CRUD, post-tax courtesy-credit pricing/funding, atomic usage caps/redemption, historical snapshots and lost-response coupon checkout recovery.

- Customer registration/login/logout, menu search/categories, single-restaurant basket, COD checkout and order history.
- Customer-owned saved addresses, labels/defaults, normalized details and immutable delivery snapshots; postal-rule checkout quotes with zone fees/minimums and closed-kitchen checks.
- Admin delivery-zone CRUD, explicit priority conflict handling and restaurant/staff area views. Postal matching is not precise distance or live geocoding.
- Restaurant weekly IST hours (including overnight), expiring temporary closure, menu creation/item availability, incoming-order refresh, rejection reasons, preparation estimates and ready-for-pickup codes.
- Owner-managed local staff invitations, manager/menu/kitchen permissions, activation/deactivation and restaurant-specific access checks.
- Versioned category/item CRUD with safe archival, variants/add-ons, validated image uploads and immutable order price/option snapshots.
- Configurable delivery/payout rules, completed-delivery earnings, paginated rider/admin history, separate COD balances and idempotent payout receipts.
- Rider online/offline profile, assignment acceptance/rejection, kitchen pickup verification, customer delivery verification, explicit COD collection acknowledgement and delivery issue reporting.
- Admin delivery issue resolution: retry/resume or confirmed return/cancellation, durable operational history, and separate cash receipt reconciliation.
- Admin account directory, order monitoring/assignment and metrics.
- Server role/owner checks, signed sessions, origin checks, PostgreSQL schema/migrations and baseline lifecycle tests.

Exact checkout arithmetic, UUID identifiers, request-bound idempotency and atomic state changes/history are implemented. See the final acceptance report and current progress/test reports for executed verification and open gates.

## Required but not complete

Remaining acceptance gaps: external email invitations/delivery, physical-device PWA installation and representative performance. PWA manifest/icons, safe public-only worker/offline fallback and bounded catalog/tenant menu pages are implemented and browser-verified. Customer verification is implemented through the protected local outbox. Operator review-case resolution is implemented; current acceptance is recorded below. Restaurant commissions/settlements and secure local account recovery are implemented and verified; production external delivery/monitoring remain separate acceptance gates. Staff onboarding is explicitly local development only; rider payout receipts record an already-made transfer rather than initiating one. Full refunds and Razorpay are implemented/tested using mocks/signed fixtures; real ONLINE onboarding is explicitly deferred. Chrome structural PWA checks pass apart from its incognito limitation; physical installation and broader device/performance gates still require verification.

The responsive web product is not a native Android/iOS app. Current statuses are operational records, not GPS tracking.

## In-app notifications / recovery

Implemented: single-use expiring hashed recovery tokens, shared throttles, generic responses, password/session-version invalidation, accessible /recover screens and protected encrypted local email outbox. External email/SMS/WhatsApp remains off; customer email changes require password and protected verification of the new address; old sessions/links are revoked after confirmation.

Order creation, state changes, assignment decisions and delivery exceptions write recipient-scoped notifications in the same transaction. Unique user/event/version keys prevent retry duplicates. Customer, owner/order-authorized staff, currently assigned rider and admins see only their own authorized history; membership/assignment is rechecked when reading. Notification history, unread counts and idempotent mark-one/all persist in PostgreSQL. The center polls only visible online tabs at 30-second intervals with bounded failure backoff up to five minutes; refresh is manual too. This is near-real-time in-app delivery, not push/SMS/email.

## Account administration and restaurant onboarding

ADMIN-only account search (name/email/ID), role/status filters, pagination and versioned role/activation changes. Public registration remains CUSTOMER-only. Linked restaurant/staff roles cannot be detached by role edits; unfinished customer purchases and active rider assignments must be resolved before role changes/approval. Administrator grants require explicit confirmation; self-deactivation/demotion is refused. Changes increment session versions, force rider offline where applicable and commit immutable audit/notifications together. Reactivated users must sign in again; no password/email editing endpoint was added.

Authenticated customer applications at /partner bind the applicant server-side, validate business address/city/six-digit PIN/contact, and allow rejected applications to be corrected/resubmitted with history. Only admins approve/reject with reasons. Approval promotes the bound active applicant, signs out older sessions and creates an INACTIVE, closed kitchen. Activation is a separate admin decision; menu, opening hours and actual delivery zones must be configured explicitly. Application postal PIN does not create delivery coverage. Existing restaurants retain their original records and ACTIVE lifecycle by additive default; no applications or approval claims were fabricated for them.

ACTIVE/INACTIVE/SUSPENDED restaurant controls are independent of owner opening hours. Inactive owners can prepare menus/settings and read permitted history; suspended restaurants lose tenant operations and disappear from discovery/new checkout. Owner account inactivity also blocks new customer quotes/orders. Existing checkout replay and customer/rider/admin history remain intact; admins and already-assigned riders can coordinate existing orders/COD during suspension. Suspended staff membership/user accounts are enforced by current server access checks. Reactivating a restaurant restores current active staff permissions; reactivating an account never revives revoked sessions. Legacy owners can view their own lifecycle without an application.

All application submissions/reviews, role/status changes and restaurant lifecycle decisions are append-only AdminAction records with actor, target, before/after, reason and idempotent reference. No deletion or external credential/KYC/payment integration is involved. Initial administrator bootstrap remains a separately controlled private deployment step.


Quantity inventory: item/variant/add-on tracking, available-unit controls, low-stock indicators, shared basket limits, server-side aggregate checks, atomic checkout commitments, versioned adjustments and immutable movement history. Early cancellations/final verified pre-acceptance refund or expiry restore original commitments once; prepared food is never automatically restocked. Existing menus start untracked. See docs/API.md and current acceptance reports; ONLINE remains disabled.

Operator review cases: searchable, paginated admin queue with assignment, priorities, guarded review/waiting/terminal states, private notes/stored evidence and immutable decisions. Authorized customer/restaurant/rider reports and actual delivery/payment/commission events populate the queue; explicit bounded import includes unresolved pre-feature records. Public status/notification views exclude operator notes. Guarded resume/return and explicit shared commission-hold release reuse order/financial safety; no prepared restock, COD collection or duplicate adjustment is inferred. Refund approvals remain deferred; isolated-local credits are prominently simulated and separate from actual books. See docs/API.md and acceptance reports. Real ONLINE/refunds/external payouts stay disabled.

Customer email verification: secure 30-minute user/email/session-bound single-use hashed tokens; protected encrypted local outbox with generic throttled resend; explicit authenticated confirmation and immutable security audits. Pending new registrations can browse, keep cart, recover accounts and read existing orders but cannot place NEW orders. Existing accounts retain legacy access without falsely marking email verified. Password-confirmed email changes take effect only after new-address proof, revoke old sessions/links and preserve historical orders. Responsive /verify-email handles pending/sign-in/success/error/change states. External email stays disabled; local protected preview only.

Reviews/ratings and promotions: verified reconciled-purchase restaurant/item reviews, admin moderation, bounded re-moderated edits, withdrawal, non-censoring tenant flags and immutable audit. Live catalog ratings come only from approved currently eligible purchases; no fabricated seeded rating. Customer/owner/admin interfaces and public review readers are connected to PostgreSQL.

Coupons support owner/admin CRUD/archival, fixed/percent courtesy credits, item/delivery eligibility, funding, schedules, caps, minimums and global/account use limits. Server-only Decimal pricing/no stacking, atomic redemption and historical funding/rule snapshots preserve money correctness; cancelled/refunded uses stay consumed. Lost-response checkout reload preserves coupon intent and recovers an owned historical quote/order. See FINANCE.md for supported post-tax policy; tax/rider payout remain unchanged. External messaging/ONLINE/payouts stay disabled.
