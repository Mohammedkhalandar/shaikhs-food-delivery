# Authentication and authorization

Registration accepts name, email and password and creates CUSTOMER only. Passwords are bcrypt hashes with cost 12; registration rejects passwords over 72 UTF-8 bytes. Login normalizes email and checks active status. A successful login/registration signs a seven-day HS256 JWT and stores it in `shaikhs_session`, HTTP-only, SameSite=Lax, path `/`, Secure in production. JWT_SECRET must contain at least 32 characters.

Every authenticated API reads the current user from PostgreSQL using the token subject, so changed roles and disabled users take effect without trusting old role claims. Logout deletes the local cookie; there is no central token revocation store.

Orders are filtered by customer, owned restaurant or assigned rider; admin can view all. Restaurant menu/status mutations require owner access (some menu routes also allow ADMIN). Rider status actions require assignment. Privileged roles cannot be requested through public registration.

Middleware in src/middleware.ts rejects mismatched Origin for API writes and missing Origin in production; APP_URL is the canonical allowed origin. Only the exact raw-HMAC-authenticated Razorpay webhook POST is exempt. This browser CSRF control is not API authentication or rate limiting. Existing routes vary between 401/403/409 for permission/state errors; consumers must read the error body.

Durable PostgreSQL throttling now covers login (10/account/15 min plus 120 global/min), registration (5/email/15 min plus 30 global/min) and authenticated payment operations (30/account/min). Identity hashes and fixed-window counters are shared across instances; untrusted forwarded IPs are not used. Auth bodies are bounded to 16 KiB; missing accounts use dummy bcrypt work; JWT verification explicitly permits HS256 only.

Missing: verification, password recovery, central session revocation, comprehensive auth event logging, upstream abuse controls and full authorization/device coverage. Do not expose demo accounts or secrets publicly. See `SECURITY_REPORT.md`.


## Account recovery and local email delivery

POST /api/auth/forgot-password accepts an email and always returns generic 202 for eligible/missing/inactive/throttled accounts. Database throttles are shared across instances. Reset links expire in 30 minutes; new requests revoke earlier links. POST /api/auth/reset-password accepts token/password, consumes the link once, hashes the password and increments authVersion atomically. All copied earlier JWTs then fail currentUser; no automatic login occurs. Only token hashes live in reset records; local mail bodies are AES-256-GCM encrypted with a separate server-only key. Email changes remain unsupported; no direct email-change endpoint was introduced.

No external messages are sent. The adapter defaults to disabled. Local mode requires a loopback shaikhs_disposable_* DATABASE_URL, loopback APP_URL and a 32-byte hex DEV_MAIL_KEY. In the approved Windows development workspace, load the isolated DB first, then `. .\scripts\use-local-mail.ps1` in each server/operator shell. This generates a stable Windows-user DPAPI-protected key under ignored .test-artifacts/dev-mail-key.xml and sets MAIL_DELIVERY_MODE=local without editing .env. Start the app from that shell. Do not print/share the key or add it to source control.

Use `npm run mail:local` for metadata, `npm run mail:local -- --reveal <message-id>` to deliberately preview an unexpired local reset link, or `npm run mail:local -- --retry` to process a bounded batch of due messages. This CLI requires possession of both local DB access and the protected mail key; links must never enter shared logs/screenshots. LOCAL_READY means previewable locally, not emailed. Failed deliveries back off, recover expired leases and stop after five attempts; expired links stop immediately. After exhausted attempts, fix local configuration and request a new link. No automatic scheduler/external delivery is claimed.

ADMIN-only /api/dev/mail exposes local metadata and due-message retry, never links/encrypted bodies/tokens. It returns 404 when local mode is unavailable or the caller is not ADMIN. Production HTTP never returns reset tokens. Production email recovery still requires a future reviewed external adapter and operational delivery/retention policy; do not enable local preview on a public database.
