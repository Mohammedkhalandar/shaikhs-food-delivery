# Physical-device and client evidence form

Copy this form into private test artifacts for each actual phone. Blank fields and NOT RUN do not count as acceptance. Never include passwords, session/reset tokens, private keys, customer addresses or unrestricted network dumps.

URL: https://YOUR-APP.YOUR-TAILNET.ts.net/

Tester/date/time zone: ______  Build identifier: ______
Device/model: ______  OS/version: ______  Browser/version: ______
Network (Wi-Fi/cellular/Tailscale), measured RTT/bandwidth: ______
Battery/thermal state, text scale, orientation: ______
Individual synthetic account role(s), without credentials: ______

## Access gate — complete before sharing test accounts

Use the [exact observed rule and focused admin proposal](TESTER_ACCESS_REVIEW.md). No proposed change has been applied; preserve unrelated services and validate both address families.

Effective local Tailscale filter was found broad across tailnet addresses and all ports. Private Serve alone is not phone-only authorization. A tailnet administrator must review policy; do not reset an existing policy or disrupt unrelated services.

| Evidence | Result (PASS/FAIL/NOT RUN) | Sanitized evidence reference/date |
|---|---|---|
| Explicit approved phone addresses/identities allowed to PC TCP 443 | NOT RUN | |
| Overlapping broad grants/ACLs reviewed and appropriately restricted | NOT RUN | |
| Unapproved device denied | NOT RUN | |
| Same URL fails with Tailscale disconnected on cellular | NOT RUN | |
| No Funnel/public sharing; no DB/Docker/admin-service forwarding | NOT RUN | |
| Trusted certificate without bypass/warnings | NOT RUN | |

## Install and workflow checklist

Android Chrome: open trusted URL → menu → Install app/Add to Home screen → confirm. iPhone Safari: open trusted URL → Share → Add to Home Screen → Open as Web App if available → Add. Launch from the new icon; a screenshot of an icon alone does not prove standalone installation.

| Physical check | Result | Screenshot/recording/bug reference |
|---|---|---|
| Installed icon, cold standalone launch and OS app-switcher behavior | NOT RUN | |
| Navigation/back, scroll, touch targets, keyboard/modals, safe areas | NOT RUN | |
| Sign-in/session persistence/logout and role restrictions | NOT RUN | |
| Cart persistence, options/quantity, address/zone quote, COD checkout | NOT RUN | |
| Duplicate/reconnect retry produces one order, not double deductions | NOT RUN | |
| Restaurant accepts/prepares/readies; assigned rider verifies pickup/delivery | NOT RUN | |
| Admin COD reconciliation, receipt/earnings/commission/history agree | NOT RUN | |
| Airplane-mode reload gives generic fallback; private API/checkout fail safely | NOT RUN | |
| Reconnect restores functionality; update does not force active checkout reload | NOT RUN | |
| TalkBack/VoiceOver, text scaling, orientation and reduced motion | NOT RUN | |

Synthetic shared order ID/reference: ______
No real online payment, message or payout occurred: ______

## Actual measurements and bugs

Use [DEVICE_MEASUREMENTS.csv](DEVICE_MEASUREMENTS.csv) for individual readings: at least three cold and three warm runs per phone, exact conditions/tool, scenario, LCP, INP and CLS. Unsupported metrics remain blank with UNMEASURABLE reason; never enter estimated values or zero for missing data. Retain outliers and screenshots. A few phone/lab runs do not establish representative field p75.

Bug: steps ______ expected ______ actual ______ severity ______
Evidence (sanitized): ______ fix/build ______ retest result/date ______

## Sign-off for the three remaining criteria

| Criterion | Evidence still required | Approver/date and decision |
|---|---|---|
| L31: premium visual identity and verified food-image rights | Client visual approval plus image-by-image license/ownership/provenance register | PENDING |
| L34: representative LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 and business metrics | Agreed field population/window/p75 methodology, measured results, business targets/results | PENDING |
| L35: physical-device/browser installation and broad device acceptance | Actual Android/iPhone checklist evidence above, defects resolved/retested | PENDING |

Exceptions and release limitations: ______
Client name/role/date, accepted scope and evidence references: ______

Developer/emulation results do not supply client approval. Real providers and production deployment remain disabled.
