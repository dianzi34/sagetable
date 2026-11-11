# SageTable — Sprint Plans

- **Team:** Xinyu Li (`@dianzi34`), Bo Pang (`@suprcp`)
- **Project Board:** [SageTable P2 Board](https://github.com/users/dianzi34/projects/1)
- **Milestones:** [Sprint 1](https://github.com/dianzi34/sagetable/milestone/1) (Nov 9–10, 2026) | [Sprint 2](https://github.com/dianzi34/sagetable/milestone/2) (Nov 11–12, 2026)

## Working Agreement

- **Branch per issue:** `<type>/<issue-number>-<short-kebab-description>` branched from `main`.
- **TDD (red → green → refactor):** Failing tests are committed first (`test(...)`) before implementation commits (`feat(...)` / `fix(...)`).
- **Conventional Commits:** Every commit uses `<type>(<scope>): <summary> (#<issue>)` with no AI attribution or `Co-authored-by` trailers.
- **Partner review:** Every PR requires partner approval before merge and passes CI checks.
- **Merge strategy:** Merge commits only (no squash merges), so failing-test commits remain visible in history.
- **Shared harness:** Both partners maintain `AGENTS.md` as constraints or workflows evolve.

## Joint Planning & Scope Constraint

Both sprints were planned jointly by Xinyu Li and Bo Pang on Nov 9, 2026.

> **Architecture Constraint Note:** No API tokens are provided for the course, so the Claude API cannot be used. We replaced live generation with a curated answer bank matched by PostgreSQL full-text search, and dropped Voyage embeddings and pgvector so the app needs no paid AI keys. SSE still streams answers side by side.

---

## Sprint 1 (Nov 9–10, 2026)

**Goal:** A signed-in user picks a theme or figures, asks a question, and gets a matched answer card with an original passage and a plain-English explanation, on a live Vercel URL.

### Sprint 1 Scope

| Issue | Title | Type | Owner | Estimate |
|---|---|---|---|---|
| [#32](https://github.com/dianzi34/sagetable/issues/32) | Sprint plans in docs/sprints.md | `docs` | `@dianzi34` | 1 |
| [#33](https://github.com/dianzi34/sagetable/issues/33) | Update PRD for the curated answer-bank constraint | `docs` | `@dianzi34` | 1 |
| [#5](https://github.com/dianzi34/sagetable/issues/5) | Scaffold Next.js app with Tailwind, Vitest, Playwright, app shell | `chore` | `@dianzi34` | 2 |
| [#34](https://github.com/dianzi34/sagetable/issues/34) | Curate seed content: texts, themes, answer bank (25 answers) | `chore` | `@dianzi34` | 5 |
| [#2](https://github.com/dianzi34/sagetable/issues/2) | US-2 Theme selection and figure picking | `feature` | `@dianzi34` | 3 |
| [#4](https://github.com/dianzi34/sagetable/issues/4) | US-4 Answer card with matched answer (one figure) | `feature` | `@dianzi34` | 3 |
| [#35](https://github.com/dianzi34/sagetable/issues/35) | Update AGENTS.md stack and constraints | `docs` | `@suprcp` | 1 |
| [#6](https://github.com/dianzi34/sagetable/issues/6) | Prisma schema on Neon with full-text search columns | `chore` | `@suprcp` | 3 |
| [#36](https://github.com/dianzi34/sagetable/issues/36) | Seed script and full-text search indexes | `chore` | `@suprcp` | 2 |
| [#7](https://github.com/dianzi34/sagetable/issues/7) | Answer matching service (full-text search + theme tags) | `feature` | `@suprcp` | 3 |
| [#1](https://github.com/dianzi34/sagetable/issues/1) | US-1 JWT auth with user, curator, admin roles | `feature` | `@suprcp` | 5 |
| [#8](https://github.com/dianzi34/sagetable/issues/8) | CI: tests on every PR and Vercel deploy previews | `chore` | `@suprcp` | 2 |

**Sprint 1 Totals:** Xinyu Li (`@dianzi34`): **15 pts** | Bo Pang (`@suprcp`): **16 pts** | **Total: 31 pts**

**Standups:** [#41 — Sprint 1 standups](https://github.com/dianzi34/sagetable/issues/41)

### Deferred to Backlog

Moved to Backlog at Sprint 1 planning (Nov 9) as out of scope for the Nov 13 deadline:
- **US-5** (Follow-up questions with one figure): [#10](https://github.com/dianzi34/sagetable/issues/10), [#11](https://github.com/dianzi34/sagetable/issues/11)
- **US-6** (Notebook): [#12](https://github.com/dianzi34/sagetable/issues/12)

### Definition of Done

1. Failing tests are committed before implementation (TDD red → green → refactor).
2. Unit and integration tests pass in GitHub Actions CI.
3. Playwright E2E tests cover core user flows.
4. PR receives partner approval.
5. Merged into `main` using a merge commit.
6. Deployed to a working Vercel preview (or production for Sprint 2 release).
7. Issue is moved to `Done` on the project board and closed.

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Content volume and verbatim passages** | Copy passages directly from verified public-domain source files only; never alter or fabricate quotes. |
| **Questions with no good match** | Provide suggested questions per theme, render a clear no-match state instead of a made-up passage, and cover relevance thresholds with automated tests. |
| **SSE on Vercel** | Configure streaming Route Handlers with `export const runtime = "nodejs"` and `export const maxDuration = 60`. |
| **Tight timeline** | Keep PRs small and focused, prioritize fast partner reviews, and stay strictly within scoped issues. |

### Sprint 1 Retrospective

Tracked in #23

#### What went well

_To be completed at the end of Sprint 1._

#### What didn't go well

_To be completed at the end of Sprint 1._

#### Action items

_To be completed at the end of Sprint 1._

#### Partner feedback Xinyu to Bo

_To be completed at the end of Sprint 1._

#### Partner feedback Bo to Xinyu

_To be completed at the end of Sprint 1._

---

## Sprint 2 (Nov 11–12, 2026)

**Goal:** Figures answer side by side in real time; curators and admins manage content and access; API docs, CI/CD, and docs are release-ready.

### Sprint 2 Scope

| Issue | Title | Type | Owner | Estimate |
|---|---|---|---|---|
| [#3](https://github.com/dianzi34/sagetable/issues/3) | US-3 Parallel SSE roundtable answers and history | `feature` | `@dianzi34` | 5 |
| [#37](https://github.com/dianzi34/sagetable/issues/37) | US-7b Review queue for flagged answers | `feature` | `@dianzi34` | 3 |
| [#15](https://github.com/dianzi34/sagetable/issues/15) | US-9 OpenAPI spec and Swagger page | `feature` | `@dianzi34` | 3 |
| [#19](https://github.com/dianzi34/sagetable/issues/19) | README | `docs` | `@dianzi34` | 2 |
| [#38](https://github.com/dianzi34/sagetable/issues/38) | Architecture diagram (docs/architecture.md) | `docs` | `@dianzi34` | 1 |
| [#39](https://github.com/dianzi34/sagetable/issues/39) | AI workflow and harness usage (docs/ai-workflow.md) | `docs` | `@dianzi34` | 2 |
| [#21](https://github.com/dianzi34/sagetable/issues/21) | Demo video (10 min) | `docs` | `@dianzi34` | 2 |
| [#13](https://github.com/dianzi34/sagetable/issues/13) | US-7 Curator: figures, themes, text upload, answer bank editing | `feature` | `@suprcp` | 5 |
| [#14](https://github.com/dianzi34/sagetable/issues/14) | US-8 Admin: roles, usage limits, audit log | `feature` | `@suprcp` | 5 |
| [#16](https://github.com/dianzi34/sagetable/issues/16) | Full CI/CD: multi-stage, CodeQL + npm audit, env management, prod deploy | `chore` | `@suprcp` | 3 |
| [#20](https://github.com/dianzi34/sagetable/issues/20) | DB schema diagram and setup guide (docs/database.md, docs/setup.md) | `docs` | `@suprcp` | 2 |
| [#40](https://github.com/dianzi34/sagetable/issues/40) | Contribution log (docs/contributions.md) | `docs` | `@suprcp` | 1 |

**Sprint 2 Totals:** Xinyu Li (`@dianzi34`): **18 pts** | Bo Pang (`@suprcp`): **16 pts** | **Total: 34 pts**

**Standups:** [#42 — Sprint 2 standups](https://github.com/dianzi34/sagetable/issues/42)

### Sprint 2 Retrospective

Tracked in #24

#### What went well

_To be completed at the end of Sprint 2._

#### What didn't go well

_To be completed at the end of Sprint 2._

#### Action items

_To be completed at the end of Sprint 2._

#### Partner feedback Xinyu to Bo

_To be completed at the end of Sprint 2._

#### Partner feedback Bo to Xinyu

_To be completed at the end of Sprint 2._
