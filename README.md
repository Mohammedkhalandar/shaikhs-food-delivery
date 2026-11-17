# Shaikh’s — Full-stack food ordering application

A runnable multi-role food ordering platform built with Next.js 15, React 19, TypeScript, Prisma and PostgreSQL.

## Included
- Customer storefront, category/search filters, basket and server-priced checkout.
- Restaurant dashboard: order queue, menu availability and add-menu workflow.
- Delivery partner dashboard: assigned order queue and delivery status actions.
- Admin dashboard: platform metrics and user directory.
- Role-aware authentication with signed, HTTP-only session cookies.
- PostgreSQL schema and seed data.
- Server-side validation, role checks, order-state transition rules and health endpoint.
- Docker Compose for local PostgreSQL.

## Requirements
- Node.js 22.12+ (Node 22 or 24 LTS recommended; see package.json engines)
- npm 10+
- Docker Desktop

## Run on Windows 11 (PowerShell)

1. Extract this ZIP and open PowerShell in the `shaikhs-full-app` folder.
2. Create your environment file:
   ```powershell
   Copy-Item .env.example .env
   ```
3. In `.env`, replace `JWT_SECRET` with a unique random value (PowerShell: `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))`).
4. Start PostgreSQL:
   ```powershell
   # First set a unique POSTGRES_PASSWORD and matching DATABASE_URL; see DEPLOYMENT_GUIDE.md.
   # Never apply this legacy template to existing resources without identity review/approval.
   docker compose up -d
   ```
5. Install dependencies and prepare database:
   ```powershell
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run db:seed
   ```
6. Start the application:
   ```powershell
   npm run dev
   ```
7. Open http://localhost:3000

## Local development demo accounts
Before seeding a new local database, set a unique `SEED_DEMO_PASSWORD` (at least 16 characters) in your private environment. The seed script creates sample customer, restaurant, delivery and admin accounts and refuses to run when `NODE_ENV=production`. It never changes existing account passwords. Never expose seeded accounts to the public internet or commit their credentials.

## API overview
- `GET /api/health`
- `GET /api/catalog`
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/orders`, `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `POST /api/restaurant/menu`, `PATCH /api/restaurant/menu/:id`
- `PATCH /api/restaurant/status`
- `GET /api/admin/users`

## Important launch limitations
This is a development candidate with incomplete launch requirements. Online payment is deliberately not enabled. The UI offers cash on delivery. Before a public launch, add a payment provider and signed webhooks if online payments are offered, email/phone verification, password reset, durable rate limiting, audit logs, live delivery location, notification provider, managed image storage, tax/legal configuration, privacy/retention policies, backups and monitoring. Same-origin checks are enabled for mutating API requests; they are not a substitute for rate limiting or a full security review. Configure HTTPS and set a unique 32+ character JWT_SECRET. Demo account seeding is for local development only.

## Production database
For production, provision managed PostgreSQL, set DATABASE_URL and a unique JWT_SECRET in your hosting provider, commit the migration files created by `npx prisma migrate dev --name init`, then run `npx prisma migrate deploy` during release. An initial PostgreSQL migration is included under `prisma/migrations`. Review it against your managed database, set `DATABASE_URL` and a separate `DIRECT_URL` if your provider uses pooled connections (then configure Prisma accordingly), and run `npx prisma migrate deploy`. Do not use `prisma db push` against production.

## Engineering documentation

Start with [SETUP.md](SETUP.md), [PROJECT_AUDIT.md](PROJECT_AUDIT.md), [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) and [TEST_REPORT.md](TEST_REPORT.md). Product, design, architecture, API and operational contracts are in [docs/PLAN.md](docs/PLAN.md) and the linked files in docs. Review [SECURITY_REPORT.md](SECURITY_REPORT.md) and [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) before release.

The environment example uses database placeholders on port 5433, matching Docker Compose. Replace them with the configured local database credentials. Do not overwrite an existing .env.

## Private source publication

Only `.env.example` belongs in Git. Environment files, backups, credentials, certificates, raw test evidence and operator-specific tailnet policies remain local. Published acceptance documents use placeholders; retain original device/network evidence privately. The supplied visual-reference HTML and companion assets are excluded; the customer redesign uses the existing Shaikh's assets and original components.

If GitHub CLI is unavailable, install it with `winget install --id GitHub.cli --exact --source winget`, reopen PowerShell, then run `gh auth login --hostname github.com --git-protocol https --web` and `gh auth setup-git`. Inspect `gh repo view Mohammedkhalandar/shaikhs-food-delivery --json nameWithOwner,isPrivate,url` first. If the repository exists, inspect its branches/history and confirm privacy before configuring a remote; never overwrite unrelated work. If it is confirmed absent, create and push with `gh repo create Mohammedkhalandar/shaikhs-food-delivery --private --source . --remote origin --push`. Verify privacy with `gh repo view --json isPrivate,url` and compare `git rev-parse HEAD` with `git ls-remote origin refs/heads/main`. Never force-push or deploy as part of publication.
