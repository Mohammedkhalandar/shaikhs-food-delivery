# Product requirements

## Vision and users

SHAIKH'S offers a clear, trustworthy mobile ordering experience for one restaurant or a controlled local group, with room to expand. Customers need an accurate menu and reliable confirmation; kitchen staff need actionable queues; riders need clear assignments; administrators need operational and financial visibility.

The initial business model is direct food sales plus configured delivery fees. Configurable marketplace commission and settlement accounting is implemented locally; external transfers remain disabled. Differentiation is dependable local service and a carefully designed, accessible interface, validated through actual operations rather than fabricated ratings.

## Core journeys

Customer registers/signs in → browses/searches → builds a single-restaurant basket → enters address → submits COD checkout → receives order confirmation/history. Restaurant accepts → prepares → marks ready. Administrator assigns an eligible rider; rider picks up and delivers. Administrators distinguish pending value from recorded paid value.

## MVP acceptance criteria

- Server validates identities, tenant access, availability, quantities and authoritative prices.
- Retrying the same checkout intent creates one order; a reused key with changed intent conflicts.
- Money is exact to paise; legal order progression is atomic and recorded.
- Closed/unavailable menu items cannot be purchased; errors preserve the user's intent.
- Every role has clear primary actions on mobile/tablet/desktop; keyboard use and reduced motion work.
- Production gates include database-backed end-to-end, unauthorized-access and concurrent-request tests.

## Nonfunctional goals and metrics

Aim for LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 in representative measured conditions. Track checkout success/retry rate, order acceptance time, fulfillment time, cancellations, support contacts and settlement discrepancies. Instrumentation and business targets are not yet configured.

## Acceptance boundary

Saved addresses, postal delivery zones, variants/add-ons, operating hours/staff, in-app notifications, delivery verification, COD reconciliation and marketplace ledgers are implemented; provider payment/refund behavior is verified locally through mocks and signed fixtures only. See `FEATURES.md` for scope and `../FINAL_ACCEPTANCE_REPORT.md` for requirement-by-requirement evidence and remaining gaps. Head-linked PWA manifest/icons, public-only service worker/offline fallback and bounded catalog pages are implemented and browser-verified. Physical installation, representative performance/device acceptance and client production readiness remain incomplete. External payments, payouts and messaging remain disabled. Risks still include inaccurate operational menus/coverage, unavailable providers, cash discrepancies and unverified image rights.
