# Environment Configuration and Secret Management

This document defines the configuration, secrets management, and deployment isolation for SageTable across the **Local**, **Preview**, and **Production** environments.

---

## 1. Environments Overview

| Dimension | Local | Preview | Production |
| :--- | :--- | :--- | :--- |
| **Hosting** | Local Node.js 20 LTS runtime | Vercel Preview Deployments (per PR) | Vercel Production Deployment |
| **Domain** | `http://localhost:3000` | `https://sagetable-*-dianzi34.vercel.app` | Custom domain / `https://sagetable.vercel.app` |
| **Database** | Docker PostgreSQL 16 (`localhost:5432` dev / `localhost:5433` test) | Neon PostgreSQL branch (isolated preview database) | Neon PostgreSQL 16 (pooled connection) |
| **Authentication** | Local JWT secret, httpOnly cookie | Preview JWT secret, httpOnly cookie | High-entropy production JWT secret |
| **Trigger** | `npm run dev` | Pull request opened/updated to `main` | Merge commit pushed to `main` |

---

## 2. Environment Variables & Secret Isolation

All secrets and configuration are server-only. They are validated at process boot via Zod schema validation in [`src/lib/env.ts`](../src/lib/env.ts).

### 2.1 Variable Matrix

| Variable | Scope | Purpose | Allowed Environments |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server-only | Primary PostgreSQL connection string with `tsvector` support | Local, Preview, Production |
| `DATABASE_URL_TEST` | Server-only | Isolated database used exclusively by Vitest integration tests | Local, CI (GitHub Actions) |
| `JWT_SECRET` | Server-only | Secret key for signing and verifying user session tokens (`jose`) | Local, Preview, Production, CI |
| `VERCEL_TOKEN` | CI/CD Secret | Vercel CLI deployment authorization | GitHub Actions repository secrets |
| `VERCEL_ORG_ID` | CI/CD Secret | Vercel Organization ID | GitHub Actions repository secrets |
| `VERCEL_PROJECT_ID` | CI/CD Secret | Vercel Project ID | GitHub Actions repository secrets |

### 2.2 Strict Security Boundary Rules

1. **No Client-Side Secret Exposure**:
   - Variables containing database credentials or cryptographic keys must **never** be prefixed with `NEXT_PUBLIC_`.
   - Any attempt to import server modules into client components is prevented by Next.js and the `server-only` package.
2. **Zero External AI Keys**:
   - In accordance with the PRD and `AGENTS.md`, SageTable relies exclusively on its curated in-database answer bank and PostgreSQL full-text search.
   - **No external AI API keys** (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`) are permitted anywhere in configuration, secrets, or source code.
3. **Cookie Security**:
   - Session cookies (`sagetable_session`) are strictly configured with `httpOnly: true`, `Secure: true` (in production/preview), and `SameSite: Lax`.

---

## 3. Multi-Stage CI/CD Pipeline

The GitHub Actions workflows (`.github/workflows/ci.yml`, `.github/workflows/codeql.yml`, and `.github/workflows/deploy-production.yml`) enforce strict quality gates:

```
[PR / Push]
    │
    ▼
Stage 1: Quality & Security
    ├── npm run lint (ESLint 9)
    ├── npm run typecheck (TypeScript strict mode)
    └── npm audit --audit-level=high (Vulnerability scan)
    │
    ▼
Stage 2: Unit & Integration Tests (PostgreSQL 16 Container)
    ├── npm test (Vitest unit tests)
    ├── npm run test:integration (DB integration tests)
    └── npm run build (Next.js Turbopack build)
    │
    ▼
Stage 3: End-to-End Tests
    └── npm run test:e2e (Playwright headless Chromium)
    │
    ▼ (On merge to main)
Stage 4: Automated Production Deployment
    └── Vercel Production Deploy (`vercel deploy --prebuilt --prod`)
```

In parallel, **CodeQL Static Analysis** runs on every push and pull request to `main` to detect security vulnerabilities, data leaks, and insecure coding patterns.

---

## 4. Secret Rotation Protocol

1. **JWT Secret Rotation**:
   - Generate a new 64-character high-entropy secret (`openssl rand -hex 32`).
   - Update `JWT_SECRET` in Vercel project environment settings.
   - Trigger a zero-downtime redeploy. Note: Active user sessions will be required to re-authenticate.
2. **Database Credential Rotation**:
   - Rotate database password or connection string in Neon Console.
   - Update `DATABASE_URL` in Vercel Project Settings for both Preview and Production scopes.
   - Run `npx prisma migrate status` against the new database string to verify connectivity.
