# Local setup

Use Node 22 LTS (minimum Next.js requirement is 20.9), npm 10+ and PostgreSQL 16, either local or Docker Desktop. Open PowerShell in `shaikhs-full-app`.

1. Run `npm ci` to install the lockfile dependencies and generate Prisma Client. Do not replace an existing `.env`.
2. For a new environment, run `Copy-Item .env.example .env`, then replace the placeholder database user/password and JWT secret. Do not print or commit the resulting file.
3. `docker compose up -d` starts the development database on localhost:5433. Its local-only credentials are configured in `docker-compose.yml`; set DATABASE_URL to match. For another PostgreSQL instance use its actual URL.
4. Run `npm run db:deploy` to apply committed migrations. For authoring a new migration in a development database only, use `npm run db:migrate -- --name descriptive_name`.
5. Optional, NEW local development database only: set a unique private `SEED_DEMO_PASSWORD` of at least 16 characters, then `npm run db:seed`. This creates sample products and four role accounts without changing existing account passwords. The script rejects NODE_ENV=production. Never seed a publicly reachable database.
6. Run `npm run dev`, then open http://localhost:3000. APP_URL must match the browser origin.

Generate a secret with `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))` in PowerShell and store it privately. JWT_SECRET must have at least 32 characters.

Checks: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npx prisma validate`, `npm run build`. Start the built app with `npm start`.

If PowerShell's npm wrapper fails, invoke `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" <command>`. If esbuild encounters sandbox directory restrictions, request permission to run the same test command outside the sandbox; do not describe an unexecuted check as passed.

See `docs/DEBUGGING.md` for database/origin troubleshooting and `DEPLOYMENT_GUIDE.md` before staging or production.
