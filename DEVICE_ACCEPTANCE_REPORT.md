# Device and client acceptance — 2026-11-15

## Tester registration/validation gate — 2026-11-15 (latest)

Fresh read-only Tailscale status still reports no peers; host YOUR-APP.YOUR-TAILNET.ts.net remains the only device identity verified. No newly registered/approved Android or iPhone identity is available. Effective broad filter is unchanged. An existing authenticated console is available, but no policy text was entered/saved; the current Machines UI did not yield a fresh usable inventory during this recheck. Earlier one-host console evidence is historical, not a new device result.

The existing docs/TESTER_ACCESS_PROPOSED.json is still an INTERIM host/operator-only MERGE FRAGMENT, not a finalized phone policy or complete replacement policy. Its semantic diff remains: exclude both host addresses from the wildcard destination grant; preserve other host ports/protocols; permit host TCP443 only from explicitly listed devices (currently host itself). SSH/nodeAttrs/unrelated permissions must remain unchanged. No invented phone identifiers were added.

Local JSON/targets/all65,536 arithmetic TCP coverage checks PASS. These are not complete Tailscale validation. The installed CLI help exposes no policy validation command; no authenticated policy API or approved console-draft validation was used. Complete-policy compilation/preview, approved-device ALLOW and unapproved-device DENY remain NOT RUN. No policy change is approved or applied. No application/database/provider change or unrelated audit.

Exact user action: install/open Tailscale on each real test phone, sign in to this same tailnet, confirm registration/approval in Machines and provide the exact machine names plus which devices are approved testers (no credentials). Then prepare the final phone-specific diff, preserve other policy sections, obtain explicit approval and validate the complete merged policy using console previews/tests before manual save. Execute paired bounded HTTPS ALLOW/DENY checks from docs/TESTER_ACCESS_REVIEW.md afterwards. Physical and client evidence still absent; local37/40=92.5%, unchanged.


## Authenticated source-policy discovery — 2026-11-15 (latest)

Read-only CLI and existing authenticated admin console confirm one registered host, mohammed/HOST_TAILNET_IPV4, no phones/zero peers. Original source grant now verified: {"src":["*"],"dst":["*"],"ip":["*"]}. Prior compiled-only limitation is superseded. Source SSH/nodeAttrs preserved; no edit/save occurred. Prepared docs/TESTER_ACCESS_PROPOSED.json: a merge fragment preserving other destinations/protocols/ports, removing broad host TCP443, and permitting known host/operator only until real phones register and are explicitly approved. Exact console merge/diff/validation steps are in docs/TESTER_ACCESS_REVIEW.md. Proposal needs explicit approval and manual application; no security settings changed.

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

Read-only Tailscale effective netmap inspection found incoming TCP/UDP rules spanning broad tailnet IPv4 ranges and fd7a:115c:a1e0::/48, with all destination ports 0–65535. This is **not a tester-only rule set**. There are zero peers in current status. No policy, Serve/Funnel configuration, routes, firewall or service was altered. Existing Serve remains HTTPS 443 →127.0.0.1:3100, no enabled AllowFunnel entry. PostgreSQL was not forwarded or exposed by this task. Private reachability is verified; explicit approved-tester isolation is not accepted.

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


## Private HTTPS quick start — latest check, 2026-11-15

**No endpoint is live yet.** Caddy, mkcert, Tailscale, cloudflared, ngrok, ADB and winget were not found; standard Tailscale/mkcert locations also absent. Device-access directory contains only the prepared Caddyfile, no TLS key/certificate. Current-user certificate inventory yielded no usable certificate. Network enumeration did not yield a usable LAN address. No repeated installation/login attempts, public tunnel, firewall/trust change or database operation was performed.

Recommended practical option: **private Tailscale Serve**, which can supply trusted HTTPS to both phones without manually installing a CA. Requires a Tailscale account and clients on this PC and the authorized phones. [Official Windows installer](https://tailscale.com/docs/install/windows); install the official Android/iOS app and connect only approved devices. No credentials need to be sent to the developer. [Serve is private to the tailnet and supports HTTPS](https://tailscale.com/docs/features/tailscale-serve); public Funnel is not permitted for this test.

### Minimum setup (operator)

1. Install Tailscale using the official installer (winget is absent). Sign in on the PC/phones, approve the devices, enable MagicDNS/HTTPS, and choose a non-sensitive PC name: certificate hostnames appear in public certificate-transparency records even though the site remains private. [HTTPS details](https://tailscale.com/docs/how-to/set-up-https-certificates).
2. In tailnet policy, allow only the explicit test-phone Tailscale IPs to the PC's Tailscale IP on TCP 443. Example grant below uses placeholders: substitute actual addresses from the device list. Existing grants/ACLs are additive; adding this narrow rule does NOT cancel a broad allow-all rule. Remove/restrict overlapping broad rules only after reviewing effects on existing services, or use a separate dedicated test tailnet. Validate the policy's allow/deny tests before starting Serve. Do not enable subnet routes, exit-node access or Funnel. [Grant syntax and additive semantics](https://tailscale.com/docs/reference/syntax/grants).

```json
{"grants":[{"src":["PHONE_ANDROID_TAILSCALE_IP","PHONE_IPHONE_TAILSCALE_IP"],"dst":["PC_TAILSCALE_IP"],"ip":["tcp:443"]}]}
```

3. On the PC use the following commands. Run status first; if Serve/Funnel is already configured, stop and inspect rather than resetting or replacing an unrelated service. Substitute the ACTUAL DNS name from the Tailscale device list; the example is not a working endpoint.

```powershell
$ts = Join-Path $env:ProgramFiles 'Tailscale\tailscale.exe'
& $ts serve status
& $ts funnel status
# Terminal A: process-local settings only, existing .env preserved.
. .test-artifacts/use-isolated.ps1
$env:APP_URL = 'https://YOUR-PC.YOUR-TAILNET.ts.net'
$env:MAIL_DELIVERY_MODE = 'disabled'
$env:RAZORPAY_SANDBOX_VERIFIED = 'false'
$env:EXTERNAL_PAYOUTS_ENABLED = 'false'
node scripts/start-production.mjs -H 127.0.0.1 -p 3100
# Terminal B, only after policy tests pass and no conflicting service exists:
& $ts serve --https=443 http://127.0.0.1:3100
```

Serve runs in the foreground: keep it open and use Ctrl+C to stop only this test service. Use the exact **Available within your tailnet** HTTPS URL printed by Serve. Do not run Funnel or accept public exposure. Certificate issuance/account consent may require tailnet-admin action. [Exact Serve CLI reference](https://tailscale.com/docs/reference/tailscale-cli/serve). This procedure has not been executed here.

4. In Terminal C, copy that actual origin (no tokens/query parameters) and run:

```powershell
$env:DEVICE_TEST_ORIGIN = 'https://YOUR-PC.YOUR-TAILNET.ts.net'
node scripts/verify-device-https.mjs
```

The verifier checks eight read-only resources: trusted TLS using default Node trust, home/manifest discovery, ready database, manifest, two PNG icons, no-store worker, offline HTML and inaccessible local outbox. It refuses HTTP, embedded credentials, other domains and redirects; never disables TLS verification or logs secrets. It saves timestamped results only on success under .test-artifacts/device-access/https-results.json. This is HTTP evidence, not browser worker/offline or physical installation evidence. Check on each phone that TLS has no warnings and the app is reachable. An unapproved tailnet device must fail, and the URL must fail with Tailscale disconnected on a phone using cellular data; record these isolation checks. No such evidence exists yet.

5. Use existing synthetic verified/legacy role accounts. Do not share admin credentials with customer-only testers; authorize role-specific accounts separately. Device-network membership is not application login. MAIL_DELIVERY_MODE=disabled keeps /api/dev/mail unavailable; recovery/verification links stay in the protected localhost-only operator flow. Do not change auth/origin/outbox guards. Database and app keep loopback bindings; never proxy 55440, Docker or a filesystem directory. Provider APIs remain disabled and signature-protected; no real webhook/refund/payout testing is authorized. Avoid publishing diagnostics/session screenshots.
6. After tests, Ctrl+C only the Serve/app processes started above; leave existing database/Docker resources running. Remove temporary tester grants/device approvals after the test window without changing unrelated access. No public production deployment is part of this procedure.

**Phone URL:** copy the exact https://...ts.net origin from Serve output after setup. A QR code is deliberately not fabricated before that URL exists; it must contain only this origin, never login tokens. Previous localhost/Caddy instructions below remain an account-free alternative requiring certificate tools/trust and Android USB or private LAN setup.

### Two-minute phone walkthrough

Connect Tailscale; open the actual URL in Android Chrome or iPhone Safari; check trusted TLS. Sign in with your assigned synthetic account; browse/search, select options/quantity/address, inspect delivery quote and place COD only. Retry the same checkout intent and confirm one order. Restaurant accepts/prepares/marks ready; assigned rider picks up/delivers; admin reconciles COD using existing guarded controls. Record the application order ID, not sensitive customer details. Customer checks history/notifications.

Install from Chrome's menu or Safari Share → Add to Home Screen (Open as Web App if available). Launch from the icon and verify standalone mode, login persistence, cart, touch/keyboard/safe areas and reduced motion. Load online, enable airplane mode, reload: expect generic offline fallback and no stale private API/checkout success. Reconnect, re-quote/retry and verify no duplicate order. Complete the detailed physical checklist below; no phone row is pre-passed.

### Field measurement recording

No new field/device values were collected this session. Do not substitute prior desktop emulation for field data. Copy docs/DEVICE_MEASUREMENTS.csv into private test artifacts for each actual run; leave unavailable metrics blank with a reason. Record real model/OS/browser, build, network type and measured latency/bandwidth, thermal/cache state, scenario and supported LCP/INP/CLS readings. Use three cold and three warm runs/device, retain all samples/outliers; aggregate only comparable conditions. A missing INP implementation is UNMEASURABLE, not 0. The protocol below and prior raw lab results remain available; representative field p75 and client business targets remain open.

Latest checks: eight Node safety/verifier tests, focused ESLint, TypeScript and static CI PASS. HTTP verifier used mocked responses only; real HTTPS/trust/ACL/phone checks BLOCKED until tooling/account/device setup. Baseline 299 application tests/743 assertions/94 axe scans was not rerun for these scripts/docs. Local acceptance unchanged: 37/40, 92.5%.


**Prepared, not physically accepted. Local completion remains 37/40 (92.5%).** No public deployment, database change, firewall change, certificate trust installation or listener was performed. ONLINE payments, external messages and payouts remain disabled.

## Exact remaining requirements

Copied from the acceptance matrix, not inferred from milestone names:

| Criterion | Current status | Evidence needed to close |
|---|---|---|
| L31: Premium visual identity and verified food-image rights | PARTIAL | Existing rendered visual review plus client visual sign-off and documented rights/provenance for every shipped food image. Screenshots do not establish rights. |
| L34: Representative LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 and business metrics | PARTIAL | Representative field/device measurements and agreed business targets; lab measurements alone do not close this criterion. |
| L35: Physical-device/browser installation and broad device acceptance | BLOCKED | Actual Android Chrome and iPhone Safari installation, standalone and workflow evidence below. |

## Available evidence and tooling

Prior verified baseline: 299 tests, 743 reported assertions, 94 clean axe scans and release gates. These were not all rerun for this preparation-only change. This session: five Node tests for access configuration passed, focused ESLint, TypeScript and static CI validation passed; localhost Caddy configuration generated successfully. No application feature changed.

ADB, mkcert, Caddy and OpenSSL are absent from PATH; ADB is also absent from the standard local Android SDK path. Only Chromium browser binaries are installed in the isolated browser directory; no WebKit runtime is installed. The Windows device-inventory query did not produce usable device evidence. No controllable phone, iOS Safari or physical installation is established. Desktop WebKit/emulation would not establish iPhone acceptance anyway.

Existing measured evidence (previous checkpoint, not newly collected device data): Windows/i7-1255U, Node 24.19, isolated Chromium 158, Lighthouse 13.6/Web Vitals 6.2.3; warm localhost production server and fresh browser profiles. Three runs/profile: mobile Lighthouse median 98 (88–98), LCP 2.263s; desktop 100, LCP 0.551s. Actual CDP mobile latency 150ms/download 200,000 bytes/s/CPU 4x: median LCP 1.116s, INP 128ms (72–176), CLS 0.00158. Desktop 40ms/1,250,000 bytes/s/CPU 1x: 0.384s/24ms/0.01289. Retain earlier diagnostic INP 304ms and first mobile score 88. These are lab observations, not field p75 or actual phone results.

Raw evidence: `.test-artifacts/performance/results.json`, six Lighthouse JSON/HTML reports and `.test-artifacts/low-network/results.json`. Rendered screenshots: `.test-artifacts/performance/mobile-hero.jpg`, `desktop-hero.jpg` and `.test-artifacts/low-network/{customer,restaurant,delivery,admin}.png`. All are desktop-generated; no physical-device screenshots exist. Full conditions/outliers remain in FINAL_ACCEPTANCE_REPORT.md.

## Prepared private HTTPS path

Prefer **Android USB with localhost HTTPS**: no LAN or public listener. iPhone requires an explicitly selected private LAN address and trusted device certificate. No public tunnel, router forwarding or database publishing is needed. The app remains HTTP on 127.0.0.1:3100 behind TLS; PostgreSQL remains 127.0.0.1:55440. The proxy blocks development-mail and provider-webhook routes, disables its administration endpoint and does not enable access logs. No certificate or secret is committed.

`node scripts/prepare-device-access.mjs localhost` has prepared `.test-artifacts/device-access/Caddyfile`. The generator uses exclusive creation and refuses overwrites; it accepts only localhost or explicit RFC1918 IPv4 addresses, with no wildcard/public bind. This is **prepared configuration, not a validated or running HTTPS service**: Caddy and device trust are missing.

Operator steps after installing Caddy, mkcert and (Android only) official Android platform-tools from their official sources:

1. Use a private test machine/network and synthetic accounts only. Check port 8443 is free. Do not stop unrelated listeners. Keep the original DB/container/volume and environment files unchanged.
2. Generate a local development CA with `mkcert -install` (explicitly changes this machine's trust store), then run from the repository:

```powershell
mkcert -cert-file .test-artifacts/device-access/device.pem -key-file .test-artifacts/device-access/device-key.pem localhost 127.0.0.1
caddy validate --config .test-artifacts/device-access/Caddyfile --adapter caddyfile
# Terminal A: protected credentials stay process-local; do not print environment variables.
. .test-artifacts/use-isolated.ps1
. scripts/use-local-mail.ps1
$env:APP_URL = 'https://localhost:8443'
$env:RAZORPAY_SANDBOX_VERIFIED = 'false'
$env:EXTERNAL_PAYOUTS_ENABLED = 'false'
node scripts/start-production.mjs -H 127.0.0.1 -p 3100
# Terminal B: starts only the loopback HTTPS proxy.
caddy run --config .test-artifacts/device-access/Caddyfile --adapter caddyfile
# Terminal C: explicit approved Android serial; authorize USB debugging on that phone.
adb devices -l
adb -s YOUR_DEVICE_SERIAL reverse tcp:8443 tcp:8443
```

3. Install **only the development CA public certificate** (`rootCA.pem` under `mkcert -CAROOT`) on the test phone using its OS certificate settings and enable the necessary trust. Never transfer `rootCA-key.pem`, `device-key.pem`, environment files or database credentials. Trust/user-CA and installed-PWA behavior varies by OS; stop if the browser reports a certificate/security warning. Do not bypass TLS warnings or disable web security.
4. Open `https://localhost:8443` on Android. Confirm secure context, trusted chain, manifest and worker control, then follow the checklist. First validate read-only readiness at `/api/health/ready`; a certificate warning or non-200 readiness is a stop condition. Use real test credentials through the UI, never URL parameters.
5. iPhone alternative: use a private Wi-Fi network, select the PC's actual RFC1918 address, and generate a **separate** Caddyfile in a copied workspace or preserve the prepared file before generating another (the script intentionally refuses overwrites). Example generator argument: `192.168.1.20` — replace with the actual PC address. Generate a certificate containing that exact IP, set `APP_URL=https://ACTUAL_PRIVATE_IP:8443`, and set `MAIL_DELIVERY_MODE=disabled` in that process: the protected local-mail adapter intentionally requires a loopback app origin. Keep all other disabled flags. Bind the proxy only to that IP. If Windows firewall blocks access, authorize only inbound TCP 8443 on the Private profile from the specific phone IP; never open 3100 or 55440. No such rule has been created by this task. Install/trust only the public CA on the iPhone; access the exact HTTPS IP URL in Safari. Use existing synthetic verified/legacy accounts; new registration/recovery mail stays unavailable in this LAN profile. Do not relax verification or local-outbox guards. Recovery remains separately tested on protected localhost.
6. Keep one APP_URL/origin per server process; do not use a different URL concurrently for writes. Secure cookies and origin checks must remain enabled. Certificate trust, Caddy validation, actual HTTPS response, same-origin authenticated writes and phone reachability all remain UNVERIFIED until performed.
7. Stop only the proxy/app processes you started with Ctrl+C. Remove only this device's forwarding: `adb -s YOUR_DEVICE_SERIAL reverse --remove tcp:8443`. Remove any specifically created firewall rule and test-phone CA trust when finished; preserve original resources. Keep keys private; do not publish lab artifacts containing session/customer data.

Recheck the preparation guards without application/database access: `node --test scripts/prepare-device-access.checks.mjs`. This is separate from the 299-test application baseline.

## Physical installation and acceptance checklist

For **each device**, record model, OS/browser versions, viewport/orientation, battery/thermal state, network/latency, URL, build identifier and date/tester. Use a clean test profile; test again with an existing session/cart. Mark each row PASS/FAIL/BLOCKED with evidence; none is pre-passed here.

| Check | Android Chrome | iPhone Safari | Required evidence |
|---|---|---|---|
| Trusted HTTPS, secure context, manifest/icons and active worker | UNVERIFIED | UNVERIFIED | Browser diagnostic capture; no certificate bypass |
| Install and standalone cold launch | UNVERIFIED | UNVERIFIED | Home Screen icon + launch recording, actual standalone display |
| Navigation/back, modal close/focus, landscape and safe areas | UNVERIFIED | UNVERIFIED | Screenshots with OS bars/notch and keyboard |
| Sign-in, persisted session, logout and role isolation | UNVERIFIED | UNVERIFIED | Protected route/API behavior; no token screenshots |
| Cart persistence, variants, addresses, zone quote and COD retry | UNVERIFIED | UNVERIFIED | Same application order on duplicate/retry; correct totals |
| Offline reload, private-data cache boundaries and reconnect | UNVERIFIED | UNVERIFIED | Generic fallback; no cached APIs/account/financial pages |
| Four-role COD journey and notifications | UNVERIFIED | UNVERIFIED | Order ID/history, COD receipt and ledgers agree |
| Touch, zoom/text scaling, screen reader and reduced motion | UNVERIFIED | UNVERIFIED | TalkBack/VoiceOver reading/focus and no obscured controls |
| Update availability during an active cart/checkout | UNVERIFIED | UNVERIFIED | No forced reload; explicit update after work is safe |

Android: open the trusted site in Chrome, use the menu's install/Add to Home screen action and complete installation. Launch from the new icon; distinguish a shortcut from installed standalone behavior. [Google's Android web-app instructions](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en).

iPhone: open the trusted site in Safari, open Share, choose Add to Home Screen, enable Open as Web App if offered, then Add. Launch from the icon and verify standalone rather than assuming it from the icon. [Apple's web-app instructions](https://support.apple.com/en-az/guide/iphone/iphea86e5236/26/ios/26). Menu wording may vary by installed OS.

Offline test: after an online visit and settled worker activation, enable airplane mode, cold-reload and navigate. Expect only the generic offline page/public assets, never a cached authenticated response. An already open screen or device-local cart is not proof of API caching. Try checkout offline: it must not claim an order was placed. Reconnect, authenticate if required, re-quote and retry the same checkout intent; verify no duplicate order/stock/redemption. Never capture sensitive API bodies or session headers in shared evidence.

## Reproducible device/performance protocol

Repeat at least three cold-profile and three warm-session runs/device, recording network and cache state separately. Use the same seeded catalog and interaction script: search, paginate, open basket, edit quantity, select address, open/close sign-in, navigate role dashboard. For COD, run the separate client script below; never time a mocked success as real checkout.

Record LCP/CLS and interaction INP where the browser actually supports the Web Vitals APIs. Use Chrome remote debugging on the Android device ([official guide](https://developer.chrome.com/docs/devtools/remote-debugging)); Safari inspection requires suitable Apple tooling. Do not label desktop Lighthouse emulation as on-device. If an API is unavailable, mark the metric UNMEASURABLE, not zero. Record individual samples, median/range, exact throttle and interaction count; a few lab/device runs cannot establish representative field p75. Agree a separate privacy-preserving field sampling window/population and business targets with the client before closing L34; no telemetry/provider was enabled here.

For repeatable existing desktop lab checks use DEPLOYMENT_GUIDE.md's pinned isolated-browser commands. These results are already preserved; rerunning identical lab conditions cannot close physical-device acceptance.

## Client acceptance script (synthetic data only)

Run with authorized separate customer, restaurant, rider and admin test accounts; record one shared application order ID and test-run reference. Do not alter historical/demo orders. Use COD only and explicitly SIMULATED settlement records; do not record a manual real transfer that did not occur.

1. **Customer:** browse/search/page, verify approved review aggregates, select available item/options and quantity, save/select a valid address, verify zone fee/minimum, apply one eligible promotion, inspect exact server quote and submit COD. Double-tap/retry/reload must return one order with one stock/redemption effect. Check accessible validation for invalid address/out-of-zone and unverified new-account restrictions. Use localhost protected outbox for verification/recovery; never distribute links in public logs.
2. **Restaurant:** confirm one incoming alert, accept with prep time, prepare and mark ready. Verify menu/stock history and staff restrictions using separate authorized roles. Try another restaurant's resources: denied. Test a separate synthetic cancellation to verify only eligible restoration occurs once.
3. **Rider:** go online, accept the assigned order, verify pickup, deliver and record COD evidence. Confirm one earning and separate COD-collected amount; repeat the action without duplicating entries. Use a separate order for customer-unavailable/address-issue and operator case handling.
4. **Admin:** reconcile that COD order once, confirm payment/order history/report totals, restaurant commission snapshot, rider earning and notification ownership. Record only explicitly simulated settlements and verify duplicate/reversal guards on synthetic records. Assign/resolve a test case without exposing internal notes to the customer. Check account/restaurant suspension prevents new access/orders while preserving records; reactivate only the synthetic test entities.
5. **Customer again:** verify final history and notification read persistence; create a verified-purchase review, observe pending moderation, have admin approve, then verify the real aggregate. Confirm rejected/expired coupon handling and stable historical price/address after changing a synthetic menu/address.
6. **Client sign-off:** review 390/768/1440 layouts and actual phones, food-image rights register, receipt/rounding/discount/commission policies, zone/postal limits, unsupported provider features and disabled external services. Specify business targets (conversion/completion/error rates, population and measurement window) rather than inventing them. Record approver/date, evidence, exceptions and retest decision per L31/L34/L35. Sign-off is pending; this document does not supply it.

Next gate: install/trust local HTTPS tooling and connect actual test phones, then execute and attach evidence. No completion percentage changes until the exact matrix criteria are satisfied.
