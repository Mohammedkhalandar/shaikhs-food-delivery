# Testing

Run from the application directory:

```text
npm test
npm run lint
npx tsc --noEmit
npx prisma validate
npm run build
```

Vitest uses Node; lifecycle tests live alongside `src/lib/order.ts`. Checkout regression tests cover arithmetic, request binding and identifiers. These unit tests do not substitute for real PostgreSQL concurrency tests.

Database suite to establish on a disposable migrated database: duplicate checkout requests return one order; changed intent/key conflicts; cross-customer keys remain isolated; closed menus reject orders; concurrent state/assignment changes cannot overwrite progress; status events roll back with failed updates; owner/rider/customer/admin permissions and inactive accounts are enforced.

Browser acceptance: customer registers → searches → adds/changes basket → enters valid address → submits once/retries → kitchen accepts/prepares/ready → admin assigns online rider → rider picks up/delivers → admin sees correct paid/pending values. Check cancellation, unavailable items, network failures, empty states and unauthorized calls.

Review at mobile (390px), tablet (768px) and desktop (1440px): horizontal overflow, touch targets, dialog focus/Escape/return focus, keyboard controls, visible errors, reduced motion and screen-reader labels. Capture actual screenshots and inspect console/network errors. Measure LCP/INP/CLS under representative conditions before reporting targets achieved.

Playwright workflow and migration regression scripts are now configured (see below). Payment webhook testing remains blocked by the absent provider implementation. Record actual execution in root `TEST_REPORT.md`.


## Repeat disposable regression checks (Windows)

Node 22 LTS or newer is recommended for the updated test tooling. PostgreSQL 16 tools are installed at C:/Program Files/PostgreSQL/16/bin in the verified environment. Tests must never point at the application DATABASE_URL.

1. Start a dedicated PostgreSQL test cluster bound to 127.0.0.1 on an unused port (the verified run used 55439). Create a NEW database whose name begins with shaikhs_disposable_. Do not reset an existing database. The local trust-auth cluster used here is disposable and must not be exposed publicly.
2. In PowerShell, set a test-only URL and run migration checks:

```powershell
$env:TEST_DATABASE_URL='postgresql://shaikhs_test@127.0.0.1:55439/shaikhs_disposable_NEW_NAME'
npm run test:migration
```

The migration script refuses nonlocal/non-disposable and nonempty databases. It intentionally retains its legacy fixtures for inspection. Use a new name on the next migration test run.

3. In the server terminal, set DATABASE_URL to that SAME disposable URL, APP_URL to http://127.0.0.1:3100, and JWT_SECRET to a unique TEST-ONLY random value of at least 32 characters. Do not edit the application's .env. Run npm run build, then npm run start -- --hostname 127.0.0.1 --port 3100 (or npm run dev with the same flags for debugging).
4. In the test terminal, keep TEST_DATABASE_URL matching the server and run npm run test:e2e. TEST_BASE_URL defaults to http://127.0.0.1:3100. Only loopback URLs and disposable-named databases are accepted. The suite creates random disposable users/menu/order fixtures; it never deletes existing data. Ensure the server uses the matching test database.
5. The suite uses installed Chrome with a fresh headless Playwright context; no existing Chrome tab/profile or login is reused. Install Chrome or adapt the explicit channel to a Playwright-installed Chromium in CI. Outputs are ignored under .test-artifacts: screenshots, workflow-results.json, accessibility.json and browser-errors.json.
6. Stop the test server and disposable PostgreSQL cluster when finished. Preserve files for review; deletion/reset requires separate authorization.

npm test runs 20 unit/mocked tests. npm run typecheck, npm run lint, npx prisma validate and npm run build remain required. Seven axe scans are automated WCAG A/AA checks, not a complete accessibility audit. No payment-provider success/failure is implied by rejected ONLINE checkout.

## Payment tests

Set TEST_DATABASE_URL to a migrated loopback database whose name starts shaikhs_disposable_. npm run test:payments explicitly fails if this variable is missing; npm test includes the real database suite when set (otherwise it visibly skips that suite). Current full result: 54 tests, including 29 PostgreSQL payment/security cases. Provider HTTP is mocked and signed payloads are fixtures; no real gateway request is implied.

npm run test:payments:http requires TEST_WEBHOOK_SECRET matching the dedicated local server's RAZORPAY_WEBHOOK_SECRET. Start that server with RAZORPAY_TEST_ENABLED=true and fake rzp_test_fixture/key/webhook secrets exclusively for disposable fixtures. The HTTP script exercises real cookies, RBAC/Origin/HMAC and financial writes without calling provider APIs; 18 checks pass. Never configure this fixture server publicly or use real credentials for it. Standard npm run test:e2e still exercises COD, screenshots and axe. Keep public ONLINE checkout disabled until an actual Razorpay sandbox acceptance run.


Customer Checkout regression: npm run test:checkout-ui uses the real local page with SDK/API interception, not real provider keys. It includes signed callback fixtures, failure/dismissal/retry/loading guards, reload recovery, duplicate events/clicks, authorization pending, three responsive widths and axe. Existing npm run test:e2e remains the real COD/DB browser suite. npm run sandbox:prepare requires an explicit disposable local URL plus new fixture credentials and performs no provider call; see RAZORPAY_SANDBOX.md. CI now runs the SDK mock suite with the real attestation flag false.

## Release diagnostics and recovery checks

`npm run db:diagnose` is read-only and returns nonzero for unavailable or mismatched migration history. Use DIAGNOSTIC_DATABASE_URL only for an explicit diagnostic override. `npm run test:release-http` targets a migrated local production server with ONLINE disabled. `npm run test:release-ui` renders the actual shared recovery component in an isolated mocked React harness at 390/768/1440; this does not simulate a real Next root crash. `npm run test:ci-config` statically checks CI controls, not a remote workflow run. Screenshots and axe reports are under .test-artifacts/release-ui.

## Restaurant/rider operations verification

With the existing isolated development session loaded (`. .\.test-artifacts\use-isolated.ps1`), `node node_modules/vitest/vitest.mjs run tests/operations.integration.test.ts` exercises real PostgreSQL availability, prep/rejection, assignment decisions, handoff privacy/rate limits, all delivery issues/resolutions, return accounting, races and legacy recovery. Fixtures are synthetic and added only to local shaikhs_disposable_* databases; no existing records are reset/deleted. `verify-workflow.mjs` now drives real tablet kitchen controls, menu toggles, rider online/offline, assignment acceptance, both verification handoffs, issue reporting/admin resolution and COD reconciliation. Screenshots: kitchen-hours-tablet, rider-issue-mobile, admin-resolution-desktop, plus three-width role views. Handoff codes are intentionally absent from unauthorized API responses. Mock payment tests remain separate from provider acceptance.

`npm run test:management` drives actual browser staff onboarding/role/deactivation, category/item/options/image editing, configured customer checkout, historical prices, rider earnings and admin receipts against localhost and a local shaikhs_disposable_* database. It refuses unrelated targets and uses synthetic accounts/images only; invitations are hidden before screenshots. Artifacts: .test-artifacts/management/results.json and seven screenshots. The main npm test suite includes real PostgreSQL management tests when TEST_DATABASE_URL is present. Test files run sequentially because versioned global fee policy is shared; monetary defaults remain unchanged by policy-version tests. CI now includes test:management; no remote CI execution is claimed.

`npm run test:addresses-zones` exercises real admin rule CRUD, mobile HOME/WORK editing/default selection, zone minimums/out-of-area errors, address-driven repricing, stale quote recovery, historical-address preservation after editing/removal, zone archival/idempotent replay and full COD reconciliation. It requires localhost and a disposable PostgreSQL URL and adds synthetic fixtures only. Artifacts: .test-artifacts/addresses-zones/results.json and six screenshots. The shared checkout/quote service is covered by real PostgreSQL concurrency/ownership/price tests. Existing browser suites now configure explicit synthetic zone records and enter postal codes; mocked Checkout fixtures never attest real delivery coverage or payments. CI includes the new suite.

Recovery/notification tests: load the isolated session and `. .\scripts\use-local-mail.ps1` before starting the localhost production server and running `npm run test:recovery-notifications`. This runs real PostgreSQL/browser password reset, copied-session rejection, generic replies, local encrypted mail, all-role notifications, delivery exceptions, duplicate event/replay protection, persistent read state and full COD reconciliation. Browser reset links stay in process memory and are stripped from URLs before screenshots; artifacts contain screenshots and redacted results only. The Vitest integration suite covers expiry/use/races/throttles/outbox retry leases and history isolation. Production external delivery is not tested or enabled.
