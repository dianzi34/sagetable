# SageTable Setup Guide

This guide covers local development, PostgreSQL 16 setup (Docker Compose and Neon), Prisma migrations, curated content seeding, environment variables, and running all test suites.

SageTable serves curated, citation-grounded answers using PostgreSQL full-text search (`tsvector` + GIN). **No external AI API keys are required anywhere in development, testing, CI, or production.**

---

## Prerequisites

- **Node.js 20 LTS** and `npm`
- **Docker** (recommended for local PostgreSQL 16 via [`docker-compose.yml`](../docker-compose.yml)) or access to a **PostgreSQL 16** / **Neon** instance
- **Chromium system dependencies** if running Playwright end-to-end tests locally (`npx playwright install chromium`)

---

## Quick Start (Fresh Clone)

For a fresh checkout, run these steps in order:

```bash
# 1. Clone the repository and enter the directory
git clone <repository-url>
cd sagetable

# 2. Install dependencies (triggers prisma generate via postinstall)
npm ci

# 3. Configure environment variables (names only: DATABASE_URL, DATABASE_URL_TEST, JWT_SECRET)
cp .env.example .env

# 4. Apply migrations to your PostgreSQL database
npx prisma migrate deploy

# 5. Seed curated figures, themes, passages, and answers into the database
npm run db:seed

# 6. Start the development server
npm run dev
```

---

## 1. Install Dependencies

```bash
npm ci
```

`npm ci` (and `npm install`) automatically runs the `"postinstall": "prisma generate"` script defined in [`package.json`](../package.json) to generate the Prisma Client.

---

## 2. Configure Environment Variables

Copy `.env.example` to `.env` in the repository root (`.env*` files are gitignored and must never be committed):

```bash
cp .env.example .env
```

All server environment variables defined in [`.env.example`](../.env.example) and validated in [`src/lib/env.ts`](../src/lib/env.ts):

| Variable | Required For | Notes |
| --- | --- | --- |
| `DATABASE_URL` | App runtime, Prisma CLI, migrations | PostgreSQL 16 connection string for development or production. Local Docker default: `postgresql://postgres:postgres@127.0.0.1:5432/sagetable` |
| `DATABASE_URL_TEST` | Integration tests (`npm run test:integration`) | Dedicated PostgreSQL 16 test database enforced by [`getTestDatabaseUrl()`](../src/server/testDb.ts). Local Docker default: `postgresql://postgres:postgres@127.0.0.1:5433/sagetable_test` |
| `JWT_SECRET` | Auth / JWT signing (`jose`) | Server-only secret of **at least 32 characters** (validated by [`getEnv()`](../src/lib/env.ts)). Generate one with `openssl rand -base64 32`. |

> **Security & AI Key Rules**
> - Never prefix `DATABASE_URL`, `DATABASE_URL_TEST`, or `JWT_SECRET` with `NEXT_PUBLIC_`.
> - No AI SDKs or API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, etc.) are used or expected.

Example local `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/sagetable"
DATABASE_URL_TEST="postgresql://postgres:postgres@127.0.0.1:5433/sagetable_test"
JWT_SECRET="replace-with-a-random-secret-at-least-32-chars"
```

---

## 3. Provision PostgreSQL 16

### Option A: Local PostgreSQL via Docker Compose

[`docker-compose.yml`](../docker-compose.yml) defines two isolated `postgres:16` containers:

| Service | Host Port | Database | Storage | Purpose |
| --- | --- | --- | --- | --- |
| `db` | `${POSTGRES_PORT:-5432}` | `sagetable` | Named volume `postgres_data` | Local development database |
| `db-test` | `${POSTGRES_TEST_PORT:-5433}` | `sagetable_test` | Ephemeral `tmpfs` | Fast isolated integration tests |

Start both containers in the background:

```bash
docker compose up -d
```

Check health before migrating or testing:

```bash
docker compose ps
```

To stop containers (`-v` also deletes the local dev `postgres_data` volume):

```bash
docker compose down
```

### Option B: Hosted PostgreSQL on Neon (Production / Previews)

1. Create a **Neon** project configured with **PostgreSQL 16** (you can optionally create separate Neon branches for preview vs. production environments).
2. Copy the PostgreSQL connection string (`sslmode=require`) into `DATABASE_URL` in Vercel (or your local shell when targeting Neon).
3. Configure `JWT_SECRET` (at least 32 characters) in Vercel Project Settings → Environment Variables. Again, **do not add any AI API keys**.
4. Apply schema migrations cleanly from your terminal or deploy step:
   ```bash
   DATABASE_URL="<neon-connection-string>" npx prisma migrate deploy
   ```
   > **Note:** [`prisma/schema.prisma`](../prisma/schema.prisma) uses `DATABASE_URL` directly (without a separate `directUrl`). If your Neon setup enforces transaction pooling on the default URL, pass Neon's direct connection string when running `prisma migrate deploy`.

---

## 4. Prisma Migrations & Database Reset

Committed SQL migrations live under [`prisma/migrations/`](../prisma/migrations). See [`docs/database.md`](./database.md) for the ER diagram and `tsvector` / GIN index details.

- **Apply or create migrations during local development:**
  ```bash
  npm run db:migrate
  ```
  (Runs `prisma migrate dev` against `DATABASE_URL`.)

- **Apply existing migrations in CI, staging, or production (non-interactive):**
  ```bash
  npx prisma migrate deploy
  ```

- **Regenerate Prisma Client after schema changes:**
  ```bash
  npx prisma generate
  ```

- **Reset the local development database (destructive):**
  ```bash
  npm run db:reset
  ```
  (Runs `prisma migrate reset`.)

> **Important:** Because [`migration.sql`](../prisma/migrations/20261112000307_init/migration.sql) declares custom `GENERATED ALWAYS AS (...) STORED` `tsvector` columns (`Passage.searchVector` and `Answer.searchVector`) plus GIN indexes, use Prisma migrations (`prisma migrate dev` / `prisma migrate deploy`) rather than `prisma db push` so generated search columns are preserved.

---

## 5. Curated Content & Seeding

Curated public-domain figures, themes, works, passages, and answer-bank entries live under [`prisma/seed/content/`](../prisma/seed/content):

- `figures.json` — 5 historical figures (`leonardo-da-vinci`, `marie-curie`, `vincent-van-gogh`, `mark-twain`, `helen-keller`)
- `themes.json` — 5 starter themes with `suggestedFigures` and `suggestedQuestions`
- `<figure-slug>.json` — works, verbatim public-domain passages, `topicKeywords`, first-person answers, and plain-English explanations (25 answers total)

The curated JSON dataset is validated against [`docs/content-style.md`](./content-style.md) by [`src/lib/seedContent.ts`](../src/lib/seedContent.ts) and tested by [`src/lib/seedContent.test.ts`](../src/lib/seedContent.test.ts).

> **Seed Runner:** Database seeding (`prisma/seed.ts`) is on `main` (#55). Run `npm run db:seed` (or `npx prisma db seed`) after applying migrations to populate all 5 historical figures, 5 themes, works, passages with unique keys, and 25 answers with full-text search vectors.

---

## 6. Run the Application Locally

Start the Next.js 15 development server (Turbopack) at `http://localhost:3000`:

```bash
npm run dev
```

Verify liveness using the built-in health endpoint (requires no database or environment variables):

```bash
curl http://127.0.0.1:3000/api/health
# {"data":{"status":"ok"}}
```

Build and run the production server locally:

```bash
npm run build
npm run start
```

---

## 7. Running Checks and Tests

All npm scripts are defined in [`package.json`](../package.json):

| Check | Command | Details |
| --- | --- | --- |
| ESLint | `npm run lint` | Runs `eslint` across the project. |
| TypeScript check | `npm run typecheck` | Runs `tsc --noEmit`. If `.next/types` has not been generated yet, run `npx next typegen && npm run typecheck`. |
| Unit & component tests | `npm test` | Runs Vitest (`vitest run`) using [`vitest.config.ts`](../vitest.config.ts) (`jsdom`, aliases `server-only` to [`vitest.server-only.ts`](../vitest.server-only.ts), excludes `*.integration.test.*` and `e2e/`). |
| Integration tests | `npm run test:integration` | Runs `src/**/*.integration.test.{ts,tsx}` against `DATABASE_URL_TEST` ([`vitest.integration.config.ts`](../vitest.integration.config.ts)). Ensure `db-test` is running first. [`vitest.integration.setup.ts`](../vitest.integration.setup.ts) applies `prisma migrate deploy` automatically and tests reset all tables between cases via [`resetTestDatabase()`](../src/server/testDb.ts). |
| End-to-end tests | `npm run test:e2e` | Runs Playwright ([`playwright.config.ts`](../playwright.config.ts)) on Chromium against `http://127.0.0.1:3000` (auto-starts `npm run dev -- --port 3000` if no server is running). Install Chromium first with `npx playwright install chromium`. |
