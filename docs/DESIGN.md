# Design system

Customer direction (2026-11-17): forest green #163E32, almond #EEE8D7, warm cream #FAF8EF/#F7F3E8, leaf #486940 and restrained burnt-orange accents. Existing Playfair Display/DM Sans typography is retained; no reference font was imported. Use oversized editorial headings, generous spacing, thin borders and quiet rounded surfaces. Restaurant/rider/admin workspaces retain their established operational styling; customer order history uses the new palette.

The current application uses CSS classes in `src/app/globals.css` and shared controls within the storefront. This pass refines the existing design rather than replacing workflows. Reusable patterns include primary/outline/icon buttons, search and form inputs, product entries, quantity controls, drawer/modal, status badges, toast, panels and empty states.

Motion should use opacity/transform, generally 150–300ms, and respect prefers-reduced-motion. Keep checkout actions immediate. Controls need visible focus, descriptive names, sufficient contrast, thumb-sized touch targets and keyboard access. Dialogs should trap focus, close on Escape and restore trigger focus.

Show only real catalog data, actual order states and configured offers. Do not fabricate ratings, testimonials, GPS or delivery guarantees. Local sample image assets need verified provenance before commercial use and must not be represented as actual restaurant dishes without confirmation.

Visual acceptance requires rendered desktop/tablet/mobile inspection, overflow checks, error/empty/loading review and screenshots. Source CSS inspection alone does not satisfy that gate. See `TEST_REPORT.md` for actual verification.

## Reference actually inspected

`<LOCAL_PRIVATE_PATH>` and its companion `_files` assets were found and read. The earlier missing ZIP was not the available reference. Actual HTML shows a sticky desktop header with rounded inset navigation, almond/green surfaces, large centered editorial typography, separate responsive hero images, spacious alternating story/category sections, transitions and a rounded-top footer. A sanitized offline copy was rendered with scripts and external network requests disabled; screenshot: `.test-artifacts/redesign/reference-desktop.png`.

The reference is used for composition and interaction quality only. No FirstClub logo, image, proprietary copy or font was copied into `src`/`public`. Reference files remain outside the application and in ignored analysis artifacts.

## Implementation plan and resulting presentation

1. Translate the visual principles into scoped `customer-premium.css`, preserving shared behavior and operational dashboards.
2. Build floating desktop/mobile navigation, an original split food hero, address selection, real kitchen previews, editorial benefits/how-ordering-works, PWA instructions and a cohesive footer. Add original About and Contact/Support pages; restyle existing partner onboarding.
3. Keep catalog/search/category pagination, stock/options, prices, coupons, reviews, address quotes, cart/auth dialogs and COD APIs authoritative. Apply customer styling to order history without rewriting backend modules.
4. Render at 390/768/1440 widths and iPhone-sized WebKit, test actual COD/cross-role flows, scan accessibility and measure production performance. Preserve existing records and disabled providers.

Kitchen discovery uses at most four distinct restaurants from the current database-backed menu page and explicitly says so. It is not an unbounded full directory. Restaurant selection uses the existing server filter and resets pagination. Ratings remain based on approved real reviews; there is no fabricated sales/popularity ranking. “Find your favourite” presents actual menu items rather than invented “most popular” statistics.

The hero address disclosure reuses `AddressBook` and the existing target state. It mounts only when opened and unmounts while the basket is open, avoiding duplicate address editors/IDs. Choosing an address is not a serviceability promise: server quotes still check coverage/hours/fees at checkout.

## Deliberate differences from FirstClub

- Food ordering and COD replace grocery/app-download marketing; no 30-minute promise, unsupported quality certification, native app-store badge or fabricated testimonial.
- Original Shaikh’s split biryani composition, S wordmark and existing type families replace the reference’s branded photo montage/type treatment.
- Existing project food images are retained and identified as illustrative, with real uploaded menu images used where supplied. Commercial provenance/client approval remains open; reference imagery is not a replacement source.
- Mobile uses a visible horizontal navigation row rather than a copied menu implementation. Public information/support routes connect to existing account/case/onboarding workflows, without fake phone/email contacts.
- Native install instructions describe the PWA honestly; desktop emulation does not establish physical installation.

## Interaction and verification safeguards

All controls retain keyboard labels/focus, native accessible disclosure behavior and existing dialog focus/Escape handling. Photo hover and a small transform-only section reveal are restrained; reduced-motion disables them and content is never opacity-hidden. Skeletons do not announce fake records. Card image geometry explicitly resets the legacy aspect ratio so the add button stays inside the card at every tested width. The browser regression command is `npm run test:customer-design`; optional local WebKit uses `TEST_WEBKIT=true` and the installed Playwright browser path. It is included in CI; remote CI is not claimed run.

## Executed visual acceptance — 2026-11-17

Final local validation passed 300 tests, 157 browser/workflow assertions and 34 axe scans; production build, TypeScript, lint and Prisma passed. Rendered and inspected Chromium mobile/tablet/desktop and iPhone-sized WebKit. New regression tests cover card/button geometry, stable pending search, no stale error count, real empty-state recovery, address-editor handoff and modal accessibility. See TEST_REPORT.md for exact performance conditions, retained INP outlier and data-preservation scope. No physical-device or client approval is supplied by this pass.
