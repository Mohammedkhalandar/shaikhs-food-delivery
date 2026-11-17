# Final product acceptance — 2026-11-15

## Customer redesign verified — 2026-11-17

Actual FirstClub HTML/assets inspected locally; original Shaikh’s forest/almond UI implemented and browser-reviewed. 300 tests, 157 browser assertions/34 axe scans, type/lint/Prisma/build/static CI pass; existing6,966 order cores and captured financial/audit rows preserved. Healthy candidate Lighthouse100 mobile/desktop; one208ms mobile INP sample retained (not all samples pass). Details/deviations: docs/DESIGN.md and TEST_REPORT.md. Private HTTPS app restored, providers off, no migrations/resource/policy changes. Original local matrix37/40=92.5% remains: client/image rights, representative field/business metrics and physical-device acceptance open. Next: client visual/device acceptance, not a repeated redesign.

## Tester registration/validation gate — 2026-11-15 (latest)

Fresh read-only Tailscale status still reports no peers; host YOUR-APP.YOUR-TAILNET.ts.net remains the only device identity verified. No newly registered/approved Android or iPhone identity is available. Effective broad filter is unchanged. An existing authenticated console is available, but no policy text was entered/saved; the current Machines UI did not yield a fresh usable inventory during this recheck. Earlier one-host console evidence is historical, not a new device result.

The existing docs/TESTER_ACCESS_PROPOSED.json is still an INTERIM host/operator-only MERGE FRAGMENT, not a finalized phone policy or complete replacement policy. Its semantic diff remains: exclude both host addresses from the wildcard destination grant; preserve other host ports/protocols; permit host TCP443 only from explicitly listed devices (currently host itself). SSH/nodeAttrs/unrelated permissions must remain unchanged. No invented phone identifiers were added.

Local JSON/targets/all65,536 arithmetic TCP coverage checks PASS. These are not complete Tailscale validation. The installed CLI help exposes no policy validation command; no authenticated policy API or approved console-draft validation was used. Complete-policy compilation/preview, approved-device ALLOW and unapproved-device DENY remain NOT RUN. No policy change is approved or applied. No application/database/provider change or unrelated audit.

Exact user action: install/open Tailscale on each real test phone, sign in to this same tailnet, confirm registration/approval in Machines and provide the exact machine names plus which devices are approved testers (no credentials). Then prepare the final phone-specific diff, preserve other policy sections, obtain explicit approval and validate the complete merged policy using console previews/tests before manual save. Execute paired bounded HTTPS ALLOW/DENY checks from docs/TESTER_ACCESS_REVIEW.md afterwards. Physical and client evidence still absent; local37/40=92.5%, unchanged.


## Authenticated source-policy discovery — 2026-11-15 (latest)

Read-only CLI and existing authenticated admin console confirm one registered host, DEVELOPMENT_HOST/HOST_TAILNET_IPV4, no phones/zero peers. Original source grant now verified: {"src":["*"],"dst":["*"],"ip":["*"]}. Prior compiled-only limitation is superseded. Source SSH/nodeAttrs preserved; no edit/save occurred. Prepared docs/TESTER_ACCESS_PROPOSED.json: a merge fragment preserving other destinations/protocols/ports, removing broad host TCP443, and permitting known host/operator only until real phones register and are explicitly approved. Exact console merge/diff/validation steps are in docs/TESTER_ACCESS_REVIEW.md. Proposal needs explicit approval and manual application; no security settings changed.

Executed eight trusted-HTTPS resource checks PASS; local draft structure/target/TCP-range checks PASS (all65,536 ports checked arithmetically, no scan). Not a Tailscale compiler/console test or actual ALLOW/DENY device result. No genuine physical observation, measurement or client sign-off supplied. Android/iPhone and access evidence remain UNVERIFIED. No unrelated regression/build audit repeated or application/data/provider changes. Local37/40=92.5%; app and existing infrastructure preserved. Next: review/approve interim draft or first connect approved phones, then manually merge/validate and record paired access and physical-device evidence.


## Physical evidence review — 2026-11-15 (latest)

Reviewed AGENTS.md, docs/TESTER_ACCESS_REVIEW.md, docs/DEVICE_EVIDENCE_TEMPLATE.md and the acceptance matrix. Read-only effective PacketFilter comparison with the documented snapshot: **unchanged broad rule**, not the proposed phone-only TCP443 restriction. Existing private HTTPS Serve still targets loopback3100 with no enabled AllowFunnel entry; current peer count 0. The original admin-console source policy is not exposed by this inspection. No policy/service/data/provider change or connectivity denial test was performed.

The evidence template remains unfilled (NOT RUN/PENDING, no completed screenshot/recording references); DEVICE_MEASUREMENTS.csv contains its header only, zero actual measurement rows. No genuine Android/iPhone results were supplied in this turn. Existing screenshots and Chromium/WebKit/lab/COD results are automated prior evidence, not phone installation or client sign-off.

**Physical status: UNVERIFIED** for Android and iPhone installation, standalone cold launch, authentication/session persistence, catalog/touch usability, COD role workflow, offline recovery and real-network performance. Approved-device success and unauthorized-device denial are also UNVERIFIED; broad effective access does not satisfy the restriction. No reproducible application defect was identified, so no feature changes or repeat regression/build/performance audits were warranted. Executed checks were read-only policy/Serve comparison, evidence-form/CSV inspection and acceptance-matrix consistency only.

Recalculated from the 40 criterion rows: **37 COMPLETE, two PARTIAL (L31 image rights/client visual approval; L34 representative field/business metrics), one BLOCKED (L35 physical-device acceptance) =92.5% local**. No criterion upgraded. Next manual action: administrator applies only a reviewed/tested focused restriction using docs/TESTER_ACCESS_REVIEW.md, then supplies completed approved/unapproved connectivity and physical-phone evidence using docs/DEVICE_EVIDENCE_TEMPLATE.md. Preserve unrelated access. Database and ONLINE payments, messaging, payouts/public deployment remain unchanged/disabled. No further retries can substitute for missing manual evidence.


## Tester-only access proposal — 2026-11-15 (current)

Read AGENTS, device report and evidence form; read-only Tailscale inspection confirms existing HTTPS 443 →127.0.0.1:3100, no enabled Funnel allowance, zero peers, and broad effective PacketFilter[0] permitting TCP/UDP/ICMP across tailnet ranges to all ports 0–65535. Exact compiled rule and server IPv4/IPv6 are recorded in [tester access review](docs/TESTER_ACCESS_REVIEW.md). The original admin-console grant/ACL text is not available through this CLI; no source-policy line is invented.

Proposed minimum semantic change: only approved phone devices may reach this server TCP 443, while existing justified permissions to other destinations/ports remain unchanged. Every overlapping broad grant/legacy ACL must be narrowed; adding a phone allow rule alone is insufficient. The review gives explicit console Preview rules/JSON/General tests instructions, a narrow allow fragment, safe destination splitting/IP-set guidance, paired authorized/unauthorized HTTPS checks and rollback precautions. **Proposal only: no policy, service, firewall, route, database or provider settings changed.** Exact source-policy diff and phone addresses require administrator review; no phones are currently identified.

Executed: eight trusted-HTTPS health/manifest/icons/worker/offline-resource/protected-mail checks PASS at https://YOUR-APP.YOUR-TAILNET.ts.net/. No new browser/physical/performance/client pass claimed; earlier automated evidence retained. Device evidence form now links the focused proposal and retains NOT RUN fields for real screenshots, install/standalone, auth/COD/offline, actual network metrics and bugs. No genuine phone results or approval were supplied. L31/L34/L35 unchanged; 37/40=92.5% local.

Manual next action: review/save only the validated focused admin policy diff, verify both address families with approved and unapproved devices, then complete docs/DEVICE_EVIDENCE_TEMPLATE.md on Android/iPhone. Keep ONLINE payments, messaging, payouts and public deployment disabled. Do not repeat manual-blocker retries or unrelated audits.


## Device/access acceptance recheck — 2026-11-15 (latest)

**Local acceptance remains 37/40 (92.5%); none of the three remaining criteria was closed.** Exact outstanding requirements: L31 premium visual identity and verified food-image rights (PARTIAL); L34 representative LCP ≤2.5s/INP ≤200ms/CLS ≤0.1 and business metrics (PARTIAL); L35 physical-device/browser installation and broad device acceptance (BLOCKED). No actual phone installation, field sample, image-rights approval or client sign-off was supplied.

### New access-control finding

Read-only Tailscale effective netmap inspection found incoming TCP/UDP rules spanning broad tailnet IPv4 ranges and <TAILNET_IPV6_RANGE>, with all destination ports 0–65535. This is **not a tester-only rule set**. There are zero peers in current status. No policy, Serve/Funnel configuration, routes, firewall or service was altered. Existing Serve remains HTTPS 443 →127.0.0.1:3100, no enabled AllowFunnel entry. PostgreSQL was not forwarded or exposed by this task. Private reachability is verified; explicit approved-tester isolation is not accepted.

A tailnet administrator must restrict overlapping broad grants/ACLs for this test destination, preserve unrelated service access, and allow only approved phone identities/addresses on TCP 443. Adding a narrow grant beside an existing broad grant does not restrict that broad access. Then record approved-device success, unapproved-device denial, and failure with Tailscale disconnected on cellular before sharing test accounts. No credential or account key is requested. This manual gate is recorded once; further automated retries cannot close it.

### Fresh executed evidence

- Eight trusted-HTTPS read-only resource checks PASS at https://YOUR-APP.YOUR-TAILNET.ts.net/. Health ready=200; default-trust TLS 1.3/hostname validation PASS; certificate remains valid through 13 February 2027. Protected mail endpoint 404; live providers stay disabled.
- **18 read-only browser assertions and two clean axe scans PASS**: Chromium 390x844 and Playwright WebKit 393x852, touch/mobile contexts and reduced motion. Checked secure context, bounded 24-card rendering/no horizontal overflow, sign-in/cart modal keyboard dismissal, active worker, rendered generic offline fallback, offline private API failure/no API cache entries, reconnection and no page errors. Normal browser contexts report standalone=false; this is not an installed app test. No orders/accounts were created by this recheck.
- Three new isolated mobile Lighthouse 13.6/Chromium 158 runs through the private HTTPS endpoint: scores 98,98,97; LCP 2.261/2.259/2.260s (median 2.260s), CLS 0/0/0.00567, TBT 43/38/113ms. Windows i7-1255U/Node 24.19; warm server/image cache, fresh browser profiles, simulated 150ms RTT/1,638.4Kbps/CPU4x, no competing suite. No new desktop run: previous desktop 100 evidence retained.
- Three measured mobile interaction traces (390x844, actual 150ms latency/200,000 bytes/s down/CPU4x, normal motion): LCP 1184/1196/1176ms, INP 48/112/48ms, CLS 0.00158/0.00158/0.01388. Medians 1.184s/48ms/0.00158; all local lab targets pass. Retain every run/outlier; these are not phone values or field p75. No claim of statistical improvement over the prior pass.
- Existing **300-test release pass**, 69 HTTPS workflow assertions/10 axe scans, secure sessions, complete four-role COD/reconciliation/ledger preservation and build/type/lint/Prisma/audit evidence remain valid prior-checkpoint evidence; not needlessly rerun or added to new counts. No working feature changed. Existing app/database/Tailscale services left intact; only owned automated browsers closed.

Artifacts: .test-artifacts/device-access/{https-results,tls-results,browser-recheck}.json, recheck mobile screenshots, .test-artifacts/performance-device-recheck/results.json and three raw Lighthouse JSON/HTML reports. Effective raw netmap is private ignored operator material; do not publish it. No physical screenshots exist. New [physical evidence form](docs/DEVICE_EVIDENCE_TEMPLATE.md) covers installation screenshots, role/COD result references, access allow/deny tests, bugs, sign-off and links to docs/DEVICE_MEASUREMENTS.csv for actual measurements.

### Manual checks (short)

1. Complete tester-only policy review and allow/deny evidence first; connect both authorized phones to Tailscale and open https://YOUR-APP.YOUR-TAILNET.ts.net/ without TLS warnings.
2. Android Chrome → menu → Install app/Add to Home screen; iPhone Safari → Share → Add to Home Screen → Open as Web App if offered → Add. Launch from icon and record actual standalone behavior/model/OS/browser/screenshots.
3. Test assigned synthetic roles, login persistence/logout, cart/address/quote/COD, restaurant preparation, rider pickup/delivery and one admin reconciliation. Check touch, keyboard, safe areas, orientation, screen reader and reduced motion.
4. Airplane-mode reload: generic fallback, no private API/checkout success. Reconnect/retry: no duplicate order/deduction/receipt. Record real device metrics and bugs in the form; unsupported values are UNMEASURABLE, never guessed.
5. Supply client visual/image-rights approval plus representative field/business targets/results separately. Checklist preparation and emulation do not supply these approvals.

Next: execute that evidence form after restricting tester access; no further feature or infrastructure work is justified by the remaining manual gates. ONLINE payments, real messaging, external payouts and public deployment remain disabled.


## Verified private HTTPS acceptance — 2026-11-15 (current)

**Working URL: [https://YOUR-APP.YOUR-TAILNET.ts.net/](https://YOUR-APP.YOUR-TAILNET.ts.net/).** The production app is running on loopback 127.0.0.1:3100 with APP_URL set to this exact HTTPS origin. External mail, ONLINE payments and external payouts remain disabled. Existing Tailscale/Docker/database resources were preserved. Earlier unavailable-tool/endpoint notes below are historical and superseded.

### Connectivity and security evidence

Tailscale backend Running, self online. Existing Serve configuration terminates HTTPS on 443 and proxies only http://127.0.0.1:3100; no AllowFunnel entry is enabled. No Serve/Funnel configuration was changed. Default-trust TLS validation succeeded with TLS 1.3 and hostname YOUR-APP.YOUR-TAILNET.ts.net, certificate valid 15 November 2026–13 February 2027, issuer YE1. No insecure certificate flag used. Eight read-only HTTPS resource checks passed; protected local-mail endpoint returns 404.

**Authorized-phone isolation is still UNVERIFIED.** Final Tailscale status reports zero peers. Serve's private configuration does not prove that the tailnet policy is limited to explicitly approved phones. Tailnet admin must verify narrow phone-to-PC TCP443 grants, no overlapping broad grants and negative tests from an unapproved device and with Tailscale disconnected. Do not enable Funnel, proxy PostgreSQL/Docker/filesystem paths or share admin credentials. No public deployment is claimed.

### Executed application acceptance

- Full PostgreSQL-backed regression: **300 tests/26 files PASS** (one new clock-skew test); eight separate Node preparation/verifier tests PASS. TypeScript, clean ESLint, Prisma validation, production build, dependency audit (zero vulnerabilities), static CI and read-only migration/checksum/schema-diff checks PASS. Remote CI was not run.
- Actual HTTPS browser/workflow: **45 assertions/six clean axe scans**, including four-role login/secure HttpOnly SameSite=Lax cookies, customer cart/dialog/COD checkout, duplicate checkout replay, restaurant processing, assignment/acceptance, verified pickup/delivery, unauthorized reconciliation rejection, idempotent COD receipt, customer history/admin report and one rider earning/commission snapshot. These are synthetic local development transactions, not actual payments/transfers.
- Actual HTTPS slow-network dashboards: **24 assertions/four clean axe scans** across customer, restaurant, rider and admin, with navigation, zero transient horizontal overflow, reduced motion, offline private-API failure and reconnection. Network 150ms/200,000 bytes/s download/CPU4x at 390x844. The current HTTPS pass totals 69 workflow assertions/10 axe scans, plus eight endpoint and eight Node checks; do not add repeat runs to historical743/94 totals.
- Chromium touch/mobile 390px, restaurant 768px and desktop 1440px tested; isolated Playwright **WebKit 27.2 at 393x852** tested for layout, modal keyboard dismissal and accessibility. This is desktop engine emulation, not actual Android Chrome/iPhone Safari. Screenshots rendered and manually inspected.
- Chrome installability errors: empty. HTTPS worker controls pages; generic offline fallback renders, authenticated APIs fail offline, no /api cache entries appear and reconnection works. Cache exclusions/version/update behavior retain prior detailed acceptance evidence; this pass does not claim every historical scenario reran. Physical installation/standalone OS behavior remains UNVERIFIED.

### Defects fixed and preservation

HTTPS login initially failed 403 because the app process still used the localhost APP_URL; corrected the process configuration without changing origin/security guards or environment files. Catalog/inventory regressions exposed an app/DB clock-boundary defect that could omit recently committed products. src/lib/catalog.ts now takes its snapshot cutoff from PostgreSQL; a deterministic lagging-app-clock regression passes. Bounded keyset/tenant/search behavior retained. ESLint now excludes only downloaded browser vendor files after new WebKit resources were picked up by lint. Preliminary synthetic-email/navigation harness mistakes were corrected; their failed attempts are not counted as passes.

Before/after private snapshots verify all **6,345 pre-existing order identities/numbers/totals/customer/restaurant links unchanged**, plus every original captured row in orderCommission2166, commissionAdjustment603, restaurantSettlement376, restaurantSettlementLine506, riderEarning2278, riderSettlement133, codSettlement851, paymentAudit4204 and adminAction1178. New synthetic fixtures retained. No migration, reseed, reset or replacement occurred; fifteen migrations ready/checksums unchanged/no schema drift. This is not a claim that every database column/table was byte-compared.

### Private HTTPS performance (measured laboratory results)

Three fresh-profile Lighthouse 13.6 runs per profile, isolated Chromium 158/Node 24.19/Windows i7-1255U, warm production application/image cache, actual HTTPS endpoint; no competing test suite. Mobile simulated 150ms RTT/1,638.4Kbps/CPU4x; desktop 40ms/10,240Kbps/CPU1x. All six accessibility/best-practices scores 100; no Lighthouse warnings. Preserve all samples, including mobile 96 and TBT143ms. TBT is not INP.

| Lighthouse | Performance median (range) | LCP median (range) | CLS median | TBT median |
|---|---:|---:|---:|---:|
| mobile | 98 (96–98) | 2.263s (2.260–2.279) | 0.00000 | 47ms |
| desktop | 100 (100–100) | 0.602s (0.592–0.606) | 0.01435 | 0ms |

Three actual CDP-throttled interaction traces/profile, normal motion, menu search/empty basket/sign-in dialogs and pagehide finalization. Mobile 390x844 uses 150ms/200,000 bytes/s download/CPU4x; desktop 1440x1000 uses 40ms/1,250,000 bytes/s/CPU1x.

| Observed lab traces | LCP median | INP median (range) | CLS median |
|---|---:|---:|---:|
| mobile-slow4g | 1.188s | 128ms (120–160) | 0.00158 |
| desktop | 0.380s | 24ms (24–32) | 0.01288 |

All six final traces meet local LCP/INP/CLS targets. These are same-host private-HTTPS **lab values**, not physical-device measurements, representative field p75 or client business evidence. Earlier checkpoint outliers remain preserved separately.

Evidence: .test-artifacts/device-access/{tls-results,https-results,https-workflow-results,finance-preservation}.json and gate logs; .test-artifacts/low-network-private-https/results.json and four role screenshots; .test-artifacts/performance-private-https/results.json plus six raw Lighthouse JSON/HTML reports. Prior artifacts retained. Temporary harness copies only pin the approved origin/preserve artifact directories; they do not relax database fixture guards.

### Short manual Android/iPhone checklist — not yet passed

1. Connect each approved phone to Tailscale; verify the phone-only policy and negative-access tests above. Open **https://YOUR-APP.YOUR-TAILNET.ts.net/** with no certificate warning.
2. Android Chrome: menu → Install app/Add to Home screen → confirm; iPhone Safari: Share → Add to Home Screen → Open as Web App if offered → Add. Launch from the icon; record actual standalone display, model, OS/browser version and screenshots.
3. Sign in with an individually assigned synthetic role account; verify session persistence/logout, touch/keyboard focus, text scaling, safe areas, orientation and reduced motion. Do not distribute admin passwords to customer testers.
4. Customer selects food/options/quantity/address and COD; restaurant accepts/prepares/readies; assigned rider verifies pickup/delivery; admin reconciles once. Customer verifies history. Record one shared synthetic order ID; no live online payment or payout.
5. After an online visit, airplane mode + reload must show the generic fallback. Offline checkout must not claim success. Reconnect/re-quote/retry without duplicate order, stock deduction or receipt. Verify installed-app update never forces an active checkout reload.
6. Record real device LCP/INP/CLS only where supported, retaining cold/warm samples and unavailable reasons in docs/DEVICE_MEASUREMENTS.csv; no guessed/zero substitution. Collect field/client image-rights, financial-policy and business-target sign-off separately.

**Completion remains 37/40 (92.5%).** L31 image rights/client visual approval PARTIAL; L34 representative field/business metrics PARTIAL; L35 physical installation/device acceptance BLOCKED. Correct HTTPS and emulation do not satisfy these remaining criteria. App remains running for manual testing; only owned automated browsers closed. Next: phone-only access verification and physical installation/checklist evidence, then client/field acceptance.


## Latest execution — private device access, 2026-11-15

Tailscale executable was not found on PATH or standard Program Files/x86/local-app locations. Elevated inspection also found no Tailscale service, registered installation or running process. Therefore no existing approved Serve/Funnel configuration, tailnet identity, certificate or actual HTTPS URL could be verified. This does not establish what is installed on a different computer/phone. No Tailscale account/configuration was altered and no tunnel was created.

The existing production app was started successfully on **http://127.0.0.1:3100** (loopback only) and left running for continuation. Protected development database configuration loaded without printing secrets; database ready=200. MAIL_DELIVERY_MODE=disabled, RAZORPAY_SANDBOX_VERIFIED=false and EXTERNAL_PAYOUTS_ENABLED=false. No database migration/seed/write/reset performed by these checks. No public listener, firewall change or secret disclosure.

Executed **12 local HTTP/browser checks**: home, manifest, no-store worker asset, offline HTML, 192/512 PNG endpoints, protected mail 404, database readiness, active controlling worker, rendered offline fallback, private API failure offline and reconnection. Actual isolated desktop Chromium at 390x844; Page.getInstallabilityErrors returned an empty list. Desktop screenshots rendered and visually inspected at .test-artifacts/device-access/localhost-mobile.png and localhost-offline.png; results in local-results.json. **Eight Node safety/verifier tests PASS.** No physical installation, private HTTPS trust/access-control test, new field measurement or client acceptance is claimed. Existing broader release-suite results remain historical, not rerun.

Action: on THIS Windows PC, finish installing/signing in to Tailscale and connect the phones. Confirm the installed executable path if nonstandard. Then verify actual Serve/Funnel status and tester-only TCP443 policy before sharing. The actual HTTPS origin must come from Serve output; none is fabricated here. Android: trusted URL in Chrome → menu → Install app/Add to Home screen → launch icon. iPhone: trusted URL in Safari → Share → Add to Home Screen → Open as Web App if offered → Add → launch icon. Full customer/restaurant/rider/admin checklist and operator commands follow below. Never use the localhost HTTP URL as a phone installation endpoint.

Local completion remains **37/40 (92.5%)**. Next: establish PC Tailscale connectivity and authorized-only HTTPS, then run the prepared real HTTPS verifier and physical-device checklist. Stop this app with Ctrl+C in its owning test-server session when finished; preserve PostgreSQL and unrelated services.


## Private HTTPS tooling checkpoint — 2026-11-15

No installed HTTPS/tunnel tooling or usable certificate/phone endpoint found. DEVICE_ACCEPTANCE_REPORT.md now gives minimal private Tailscale Serve setup with explicit phone-to-PC TCP443 grants, overlapping-policy/Funnel checks, disabled local mail, exact-origin commands and device walkthrough. No account created, listener started, trust/firewall/database change or public exposure. Added read-only scripts/verify-device-https.mjs and eight passing Node safety/verifier checks (mock HTTP fixtures only), focused lint/TypeScript/static CI pass. Added blank docs/DEVICE_MEASUREMENTS.csv for actual device evidence; no estimated measurements or fabricated URL/QR. Prior full-suite evidence unchanged; real TLS/ACL/PWA/physical evidence awaits account/tool/device setup. Local 37/40=92.5%; ONLINE/messages/payouts disabled.

## Device/client acceptance preparation — 2026-11-15

Exact remaining criteria verified from matrix: L31 visual identity/image rights PARTIAL; L34 representative LCP/INP/CLS and business metrics PARTIAL; L35 physical device/browser installation BLOCKED. Created DEVICE_ACCEPTANCE_REPORT.md with private HTTPS/USB and LAN operator procedures, Android/iPhone installation checklist, measured lab evidence, explicit unverified device results and cross-role client acceptance script.

Added scripts/prepare-device-access.mjs: exclusively creates ignored Caddy configuration, allows only localhost or explicit RFC1918 host, binds that address only, proxies loopback app, blocks dev-mail/webhooks and disables proxy administration. It does not start services, change firewall/trust, read secrets or overwrite files. Prepared localhost configuration only; Caddy/mkcert/ADB absent, no physical phone or WebKit runtime established. HTTPS not started/validated and no device install claimed. LAN profile keeps mail disabled; protected localhost outbox guards remain unchanged.

Executed five Node safety/configuration tests (node --test scripts/prepare-device-access.checks.mjs), focused ESLint, TypeScript and static CI validation: PASS. Prior 299 tests/743 assertions/94 axe scans and lab results remain previous-checkpoint evidence, not new device runs. No application feature/schema/database/environment changes, no listeners or firewall rules started; original services untouched. Completion remains 37/40=92.5%. Next: install/trust private HTTPS tooling, connect actual Android/iPhone, execute evidence checklist and obtain image-rights/business-policy client sign-off. External providers and public deployment remain disabled.


Local acceptance audit completed; **full product acceptance remains open**. This report distinguishes the implemented local web product from production readiness. No public deployment, actual provider transaction, real message or external payout is authorized or claimed. Existing PostgreSQL data/resources are preserved; tests append uniquely identified synthetic fixtures only.

## Database recovery and lab/device acceptance — 2026-11-15

**Current state: original development database online; 37/40 local criteria COMPLETE (92.5%). Physical installation remains BLOCKED.** The existing Linux engine/container was already running when inspected; no restart or repair was necessary. Verified the exact container `shaikhs-isolated-LOCAL_ONLY_ID`, volume `shaikhs_isolated_LOCAL_ONLY_ID`, database `shaikhs_disposable_LOCAL_ONLY_ID` and loopback-only `127.0.0.1:55440` binding. Authenticated identity matched protected local configuration without printing credentials. No replacement, password reset, volume change, migration or reseed occurred.

All four pre-existing demo accounts/roles and their restaurant link remain. Compared every one of the **5,918 pre-existing orders** against a pre-test snapshot: IDs, order numbers, totals and customer/restaurant links are unchanged. Current order count is 6,345 after uniquely named synthetic test fixtures; no original order disappeared. Fifteen migrations/checksums and Prisma schema diff pass read-only. Only the owned application server was stopped; no 3100 listener remains and PostgreSQL is connected.

Executed this milestone: **299 tests/26 files, 743 reported workflow/HTTP/component assertions, 94 clean axe scans**, TypeScript, clean ESLint, Prisma validation, dependency audit (zero vulnerabilities), production build and static CI verification. The broad 719/90 browser baseline was rerun, plus 24/four low-network role checks. After the final font-only refinement, PWA60, COD workflow83, management36, mocked Checkout67, web/category, HTTP10 and low-network24 were rerun successfully. Repeated passes are not added. Remote CI was configured/validated, not executed.

### Measured performance conditions and results

Lighthouse 13.6.0 and Web Vitals 6.2.3 on isolated Chromium Headless Shell 158.0.8127.18, Node 24.19.0, Windows x64/i7-1255U. Warm local production server/image cache, fresh browser profile per Lighthouse run, no competing test suite; three runs per profile. Mobile Lighthouse uses its default simulated 150ms RTT/1,638.4Kbps/4× CPU; desktop 40ms/10,240Kbps/1×. Raw settings, browser version and machine metadata are stored with results. These are laboratory measurements, not field percentiles or physical-device results.

| Lighthouse profile | Performance median (range) | LCP median (range) | CLS median | TBT median |
|---|---:|---:|---:|---:|
| Emulated mobile | 98 (88–98) | 2.263s (2.263–2.405s) | 0 | 13.5ms |
| Desktop | 100 (100–100) | 0.551s (0.548–0.562s) | 0.01563 | 0ms |

All six Lighthouse accessibility/best-practices scores were 100. The first mobile performance score of 88 is retained; the median does not erase that cold-run variability. Simulated LCP is distinct from the following observed interaction traces; TBT is **not** used as a substitute for INP.

Three fresh-context interaction runs per profile used the official Web Vitals attribution build and actual pagehide finalization. The case covers anonymous menu search, empty-basket and sign-in dialogs. Mobile 390×844 uses actual CDP 150ms latency/200,000 bytes/s download/4× main-thread slowdown; desktop 1440×1000 uses 40ms/1,250,000 bytes/s/1×. Normal motion enabled.

| Observed lab profile | LCP median | INP median (range) | CLS median |
|---|---:|---:|---:|
| Mobile slow4G | 1.116s | 128ms (72–176ms) | 0.00158 |
| Desktop | 0.384s | 24ms (16–24ms) | 0.01289 |

All six final traces meet the local LCP/INP/CLS targets. An earlier single-run 304ms INP observation during experimentation is retained as a diagnostic warning; repeated traces do not prove field p75. An initial installed-Chrome series contained host-injected adblock scripts absent from the server response and was excluded from acceptance. No host security software was changed. A self-hosted-font/preload trial regressed simulated mobile LCP and was rejected; its artifacts remain separate from final reports.

### Verified implementation and usability changes

- Existing role panels load on demand. Extracted the unchanged shared fetch helper to `src/lib/management-client.ts` (backward export retained), preventing public readers from eagerly importing management UI. Estimated unused landing JavaScript fell from 51KiB to 21KiB in the clean-browser reports.
- Original typography remains. Font CSS is discovered directly in the global document head with preconnected origins, replacing the nested CSS import chain. Hero imagery has explicit high fetch priority. No food image or financial rule was changed.
- Four real authenticated roles passed slow-network 390px checks (150ms/1.6Mbps/4× CPU): no transient overflow, reduced motion respected, navigation usable and private APIs fail offline rather than serving stale data. Added `test:low-network` to CI and an optional pinned-tool `test:performance` runner. Normal-motion axe scans now wait for finite entrance animations to finish; all contrast/permission/money assertions remain.

Evidence: [raw metrics](.test-artifacts/performance/results.json), [mobile Lighthouse report](.test-artifacts/performance/mobile-2.html), [desktop report](.test-artifacts/performance/desktop-2.html), `.test-artifacts/recovery-*.log`, [data-preservation proof](.test-artifacts/recovery-acceptance/preservation.json), [slow-network role results](.test-artifacts/low-network/results.json). Current responsive/role screenshots were rendered and inspected. Rejected experiments are under separately named ignored artifact directories; no rejected font files ship in public assets.

Remaining gates: physical Android/iOS installation/standalone behavior, representative field p75 and business metrics, client content/financial policy and production acceptance. Local completion remains 92.5% because L34 includes field/business evidence, L35 requires physical devices and L31 retains client/content approval. ONLINE payments, real messaging/refunds/payouts and public deployment remain disabled.

## PWA/catalog milestone — 2026-11-15 (previous checkpoint)

Current local coverage is **37/40 COMPLETE = 92.5%**: PWA manifest/install criteria and safe offline behavior are now implemented and browser-verified. Two PARTIAL groups (content rights/client visual acceptance and representative performance/business metrics) and one BLOCKED group (physical devices) remain. Production gates remain separate and incomplete; no physical installation, public deployment, real payment/message/payout is claimed.

Implemented head-discoverable manifest, 192/512/maskable PNG icons, standalone/safe-area styling, production worker registration, explicit updates without forced reload, bounded/versioned public caches and generic offline fallback. No API, RSC, account, checkout, payment, financial or navigation response is cached. Private/no-store responses are rejected; storage failures preserve online operation; cleanup preserves unrelated caches. Chrome parsed the manifest without errors: only `in-incognito` remains in its installability checks.

Catalog and tenant menus now use validated ID keyset pages (default24/max48), filter/tenant-bound snapshot cursors, bounded option reads and page-scoped rating aggregation. Existing primary/tenant indexes were verified; no schema/migration changes needed. Customer filters/pages persist in URLs and browser history, next/first actions focus results, and off-page baskets hydrate at most48 explicit IDs. Owned historical retry hydration preserves archived-product recovery without authorizing new purchases. Menu/category/inventory controls now expose bounded pagination/search rather than loading complete lists. Category choices describe the current page; exact category filtering remains available. Live availability is always rechecked at checkout.

Executed: **299 tests /26 files; 719 reported workflow/HTTP/component assertions; 90 clean axe scans**. This is the previous659-assertion broad suite rerun during this milestone plus the final60-assertion/seven-scan PWA/catalog suite; repeated runs are not added. The twelve role/viewport audits and three category scans remain separate from assertion totals. Final build additionally passed PWA/catalog, staff/menu36, mocked Checkout67, web/category checks and release HTTP10 after the final page-label/focus refinement. TypeScript, clean lint, Prisma validation, dependency audit (zero vulnerabilities), static CI, production build and unchanged fifteen-migration/schema readiness pass. Remote CI was configured/validated, not executed.

A default localhost request returned24 products,13,744 bytes in187ms; this single local sample does **not** establish field LCP/INP/CLS targets. Browser tests verified two real synthetic COD orders with products from different pages, page reload/back/search, ownership, explicit worker updates without reload, namespace cleanup, no private caching and offline API failure. A tablet restaurant test verified search/next-page controls and accurate page-count labeling. Unit tests cover cursor limits/binding, insert stability, literal wildcard search, index/query bounds, archived retry ownership, private-cache rejection and denied storage.

Verified fixes: Next's streamed body manifest link was invisible to Chrome; explicit head links resolved it. First install no longer announces an update. Missing/off-page basket items cannot silently create a partial order. Existing UI fixtures now search their namespace and wait for server filter responses rather than assuming an unbounded synchronous catalog. Initial harness email normalization, API-mock and asynchronous scan failures were corrected without removing money, permission, retry or accessibility assertions.

Evidence: `.test-artifacts/pwa-tests.log`, `pwa-build.log`, `pwa-lint.log`, `pwa-prisma.log`, `pwa-audit.log`, `pwa-verify-*.log`, and [PWA/catalog results](.test-artifacts/pwa-catalog/results.json). Rendered captures manually inspected: [mobile offline](.test-artifacts/pwa-catalog/offline-390.png), [mobile menu](.test-artifacts/pwa-catalog/catalog-390.png), [desktop menu](.test-artifacts/pwa-catalog/catalog-1440.png), [restaurant tablet](.test-artifacts/pwa-catalog/restaurant-768.png), plus the generated maskable icon. Development data/resources retained; no reset, reseed, migration or external-service activation. Remaining work is physical-device installation, representative performance/operational metrics and client/production acceptance.

## Status rules and scope

Historical availability note (superseded by recovery verification above): the previous session's closing check found localhost:55440 refusing connections. No restart or alteration was attempted then. Current identity/connectivity, migration/schema and original-order preservation checks now pass.

COMPLETE = implemented and supported by executed local evidence. PARTIAL = implemented portions with an explicit acceptance gap. MISSING = required implementation absent. BLOCKED = acceptance needs an unavailable device, external service or separate authorization. Complete does not imply exhaustive testing of every possible input or every physical device.

The following 40 local requirement groups reconcile PRD core journeys/acceptance/nonfunctional goals, FEATURES inventory and PLAN phases 1–7. Repeated requirements across documents share one row. All statuses are local unless explicitly marked production. The unweighted completion percentage is COMPLETE rows / 40; partial rows receive no credit. Physical installation is separate from browser emulation. Native apps, GPS tracking, paid maps and live geocoding are outside the current web scope.

## Local requirement matrix

| ID | Requirement | Status | Source / verification evidence |
|---|---|---|---|
| L01 | Registration, sign-in/out and current sessions | COMPLETE | `src/lib/auth.ts`; workflow, recovery and email-verification suites |
| L02 | Menu search, categories and honest catalog | COMPLETE | storefront/catalog APIs; workflow and commerce |
| L03 | Single-kitchen persistent cart, quantities and options | COMPLETE | storefront/cart-options; workflow, management, checkout UI |
| L04 | Server prices and exact paise totals | COMPLETE | order/quote/commissions/promotions services; order and commerce tests |
| L05 | Bound checkout keys, ambiguous-response recovery and local payment/order deduplication | COMPLETE | checkout service/client; workflow, commerce, mocked Checkout; actual provider acceptance remains P01 |
| L06 | Atomic legal status transitions and order history | COMPLETE | order/status API; lifecycle concurrency and workflow |
| L07 | Opening hours, pauses, availability and lifecycle gating | COMPLETE | operations/onboarding; operations and administration tests |
| L08 | Owned/default addresses and historical delivery snapshots | COMPLETE | addresses service; addresses-zones suite |
| L09 | Postal zones, fee/minimum and overlap resolution | COMPLETE | quote/zone service; addresses-zones; no distance claim |
| L10 | Customer COD checkout, confirmation and history | COMPLETE | workflow real PostgreSQL journey |
| L11 | Menu/category/option CRUD and image validation | COMPLETE | menu-service/menu-image; management suite |
| L12 | Local staff onboarding and tenant-specific permissions | COMPLETE | restaurant access/staff APIs; management suite |
| L13 | Rider availability and assignment acceptance/rejection | COMPLETE | operations services; workflow/operations |
| L14 | Verified handoffs, delivery exceptions and resumption | COMPLETE | order/operations; workflow and cases |
| L15 | Explicit COD receipt and reconciliation | COMPLETE | payment/receipt records; workflow, inventory, commerce |
| L16 | Rider earnings, cash balances and recorded settlements | COMPLETE | payout ledger APIs; management tests; no transfer initiated |
| L17 | Effective commission rules and immutable order snapshots | COMPLETE | commissions; PostgreSQL commissions suite |
| L18 | Restaurant settlement, holds, disputes and reversals | COMPLETE | commissions/finance APIs; restaurant-finance suite |
| L19 | Admin account controls and restaurant onboarding | COMPLETE | admin/onboarding services; administration suite |
| L20 | Tracked stock/options, atomic reservation and safe restoration | COMPLETE | inventory; concurrent inventory tests/browser |
| L21 | Verified reviews, moderation and approved-only live ratings | COMPLETE | reviews service; commerce suite |
| L22 | Scheduled coupons, eligibility, budgets and immutable credits | COMPLETE | promotions/checkout; commerce concurrency and browser |
| L23 | Owned notifications, unread history and deduplicated events | COMPLETE | notifications; recovery-notifications suite; bounded visible-tab polling |
| L24 | Single-use hashed reset, revocation and protected local outbox | COMPLETE | recovery/local-mail; recovery-notifications suite |
| L25 | Customer verification and safe email changes | COMPLETE | email-verification; email-verification suite |
| L26 | Operator cases, private notes, safe resolutions and audit | COMPLETE | review-cases; cases suite; simulated credit explicitly separate |
| L27 | Current authorization, tenant isolation, suspension and origin checks | COMPLETE | auth/access/middleware; cross-role suites and negative tests |
| L28 | Concurrent updates, retry deduplication and financial audit integrity | COMPLETE | PostgreSQL transaction/integration suites |
| L29 | Four-role responsive primary actions, keyboard and reduced motion | COMPLETE | workflow 390/768/1440 screenshots plus rendered page audit |
| L30 | Accessible modal, loading/error and recovery interactions | COMPLETE | axe, workflow dialog focus/Escape, checkout and release UI |
| L31 | Premium visual identity and verified food-image rights | PARTIAL | Rendered visual review; warm tokens/imagery retained. Image rights/provenance not established by screenshots |
| L32 | Install manifest, install icons and PWA installability | COMPLETE | Actual head-linked manifest/icons parsed by Chrome; only isolated-browser incognito error remains. Physical installation is L35 |
| L33 | Service worker, offline application fallback and safe offline caching | COMPLETE | Production registration, public-only bounded/versioned cache, explicit no-reload updates, generic offline navigation and private/API/RSC exclusion verified |
| L34 | Representative LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 and business metrics | PARTIAL | Bounded catalog, six final Lighthouse reports and six observed lab traces verified. Field p75/physical-device evidence and business targets remain unconfigured |
| L35 | Physical-device/browser installation and broad device acceptance | BLOCKED | Trusted HTTPS and Chromium/WebKit mobile emulation verified; physical-device installation not tested; tester-only effective policy not accepted |
| L36 | PostgreSQL persistence, migration checksums and schema readiness | COMPLETE | Approved loopback:55440 read-only diagnosis/schema diff; 15 migrations ready |
| L37 | Signed backup, guarded new-target restore and recovery guidance | COMPLETE | backup/restore scripts and isolated restore drill; never overwrite source |
| L38 | Runtime validation, health, startup and sanitized local errors | COMPLETE | deployment/release HTTP/UI tests; readiness fails closed |
| L39 | Unit/integration/browser/a11y/type/lint/schema/audit/build gates | COMPLETE | Exact current executed results below; static CI is not a remote CI run |
| L40 | Implemented disabled online integration with mock/signed-fixture coverage | COMPLETE | payments integration and mocked Checkout; no actual sandbox acceptance claimed |

## Separate production gates

| ID | Requirement | Status | Remaining acceptance |
|---|---|---|---|
| P01 | Real Razorpay orders, verified events, refunds and reconciliation | BLOCKED | Onboarding explicitly deferred. ONLINE stays disabled; no credentials requested |
| P02 | External account/staff email and other messaging | BLOCKED | Protected local outbox only; provider delivery/retention/retries not accepted |
| P03 | Actual restaurant/rider payouts | BLOCKED | Ledger/receipt/simulated records do not transfer funds |
| P04 | Client HTTPS deployment, remote CI and operational release | BLOCKED | No public deployment authorized or executed; static workflow validation only |
| P05 | Client financial/tax policy, service coverage and content approval | PARTIAL | Supported post-tax courtesy-credit policy documented; legal/client operational sign-off absent |
| P06 | Production monitoring, retention and encrypted offsite recovery | PARTIAL | Local structured errors/signed restore verified; alerts, offsite storage/PITR and recovery objectives need deployment acceptance |

## Previous final-audit verification (baseline)

All listed checks executed during this audit. Final full Vitest: **286 tests / 24 files passed**. Reported workflow/HTTP/component assertions: **659**, plus twelve additional rendered role/viewport audits and the web/PWA findings checks. **83 clean WCAG A/AA scans**: 68 in the listed suites, twelve responsive audits and three category-navigation scans. Repeated successful runs are not added to totals.

| Suite | Assertions | Axe scans |
|---|---:|---:|
| Complete PostgreSQL COD workflow | 83 | 11 |
| Staff/menu/options/rider settlements | 36 | 6 |
| Addresses and postal zones | 39 | 6 |
| Restaurant commissions/settlements | 52 | 4 |
| Recovery and notifications | 63 | 7 |
| Accounts/onboarding/lifecycle | 82 | 6 |
| Inventory | 39 | 5 |
| Operator review cases | 55 | 6 |
| Customer email verification | 46 | 6 |
| Reviews/promotions | 61 | 5 |
| Mocked online Checkout: 20 scenarios | 67 | 3 |
| Shared error recovery component | 26 | 3 |
| Real release HTTP checks | 10 | 0 |
| Additional authenticated role/viewport audit | Recorded separately: 12 pages | 12 |
| Web/PWA/category findings | Recorded separately | 3 |

Final category fix: 56-pixel navigation height at 390/768/1440 widths, keyboard activation/pressed state, loaded food imagery, no document overflow and three clean focused axe scans. Final build additionally reran commerce, mocked Checkout, release UI/HTTP and web acceptance successfully. The broad cross-role suites passed before the last category-only refinement; focused final-build checks cover that refinement rather than claiming every suite was rerun after it.

TypeScript, ESLint, Prisma validation, optimized production build, static CI gates and dependency audit pass (**zero reported vulnerabilities**). Approved database: fifteen ready migrations, no pending/checksum changes and no Prisma schema drift. Signed backup restored all **46 tables** with exact data/schema fingerprints into a NEW disposable target; source unchanged, existing-target/stale-backup refusal and financial immutability verified. Ten additional restored-startup/configuration/database-loss assertions passed. These are local checks, not a remote CI run or public deployment.

Detailed logs: `.test-artifacts/final-tests.log`, `final-build.log`, `final-lint.log`, `final-prisma.log`, `final-audit.log`, `final-backup.log`, `final-deployment.log` and `final-verify-*.log`. Only owned test servers were stopped; no localhost:3100 listener remains. Development PostgreSQL and every existing container/volume remain running/preserved. No migration or seed was applied in this audit. Protected helper configuration is required to select the approved target; preserved default environment configuration is not substituted for it. This extracted directory has no Git baseline; no commit, diff baseline or remote CI execution is invented.

Commands: full Vitest with TEST_DATABASE_URL; ESLint; Prisma validate; production build; TypeScript; npm audit; read-only database diagnostics/schema diff; static CI validation; signed backup/new-database restore and startup checks; localhost production server; workflow, management, address-zone, finance, recovery-notification, administration, inventory, operator-case, email-verification, commerce, mocked Checkout, release UI/HTTP and web acceptance scripts. Config is loaded from protected local helpers; secrets are never printed. No migrations, resets or seed run are needed for this audit.

## Defects corrected during acceptance

- API responses, including unauthenticated failures, lacked uniform explicit cache protection. Middleware now applies `Cache-Control: no-store`, with regression coverage and actual HTTP verification.
- Dashboard navigation linked to `#menu`/`#story` while those sections were unmounted. Links now switch to the shop and scroll after rendering; responsive browser audit exercises the visible navigation.
- At desktop widths, accumulated category filters wrapped into a very tall block ahead of the food cards. Category navigation now scrolls horizontally at every width, supports keyboard selection and bounded long labels, and retains complete accessible names.
- PRD/FEATURES contained stale future-scope descriptions of completed modules. Updated those statements; dated older PLAN/progress entries remain historical, superseded by this acceptance report.

The first restore attempt lacked an explicit PostgreSQL client transport; configured the documented existing-container transport. A subsequent source-comparison guard correctly rejected concurrent HTTP-test writes. The application was then stopped for a quiesced new-target drill; no existing database was overwritten. Failed validation attempts are not counted as successful tests.

Commerce's injected lost-response check initially exhausted its five-second UI wait while the request was still finishing; its failure screenshot showed the expected network-error feedback. The harness now synchronizes on the actual failed request before asserting the toast. The exact committed-order, unchanged retry key, redemption, stock and money assertions are retained.

## Rendered evidence and limits

Screenshots are local ignored artifacts, not a public archive. Current workflow writes `.test-artifacts/screenshots/{customer,restaurant,rider,admin}-{mobile,tablet,desktop}.png` at 390/768/1440 widths, plus storefront/cart/sign-in/operations captures. Commerce, account, inventory, case and other suites retain their focused screenshots and axe results. Final responsive audit: `.test-artifacts/final-acceptance/responsive.json`; PWA/routes/offline findings: `web.json`; rendered mobile 404: `not-found-mobile.png`.

| Role | Mobile / tablet / desktop visual evidence |
|---|---|
| Customer | [Contact sheet](.test-artifacts/final-acceptance/customer-contact.png) |
| Restaurant | [Contact sheet](.test-artifacts/final-acceptance/restaurant-contact.png) |
| Rider | [Contact sheet](.test-artifacts/final-acceptance/rider-contact.png) |
| Admin | [Contact sheet](.test-artifacts/final-acceptance/admin-contact.png) |
| Final menu fix | [390](.test-artifacts/final-acceptance/categories-390.png), [768](.test-artifacts/final-acceptance/categories-768.png), [1440](.test-artifacts/final-acceptance/categories-1440.png) |

Manually inspected all twelve role/viewport captures through four contact sheets, plus desktop hero, mobile/desktop menu loading and loaded states, and mobile 404. Warm typography, card alignment, spacing, photo loading, wrapped order identifiers and responsive actions were reviewed. The category overflow defect found in that review is fixed and independently checked. Automated axe is not a complete manual accessibility certification; headless Chrome is not iOS/Safari or physical installation. UI fixtures use actual application components where identified but mock provider interactions are never real payments. No claim that every possible button/state or network condition has been exhaustively verified.

## Completion and next stage

Local requirement coverage: **37/40 COMPLETE = 92.5%**; two PARTIAL and one BLOCKED. Production gates: zero of six complete. Core COD and PWA/catalog functionality passed local acceptance, but the whole requested product is not 100% complete or production-ready.

Changed product files: `src/middleware.ts`, `src/middleware.test.ts`, `src/components/storefront.tsx`, `src/app/globals.css`. Acceptance tooling: new `scripts/acceptance-page-audit.mjs` and `verify-web-acceptance.mjs`; updated workflow/commerce/CI scripts, package test command and CI configuration. Updated PRD/FEATURES/PLAN, progress and test reports; added this report. No domain module or database schema was rebuilt.

Next acceptance work: physical Android/iOS installation and standalone behavior, representative performance/business metrics, image-rights/client-policy and separate production acceptance. PWA/offline and bounded catalog implementation are complete locally; no unrelated feature was started. ONLINE payments, actual refunds/payouts, real messaging and public deployment remain disabled.
