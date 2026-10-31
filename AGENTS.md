# AGENTS.md — SageTable

## 0. How to Use This File

- Read this whole file before starting any task.
- Then read the GitHub issue you are working on and the PRD user story it references.
- If a request conflicts with this file, stop and ask instead of guessing.
- Work only on the scope of the current issue. Do not implement other issues "while you're there".

---

## 1. Project Context

### 1.1 What SageTable Is

A full-stack web app where users bring a real question to a roundtable of 2–3 great figures (e.g., Mark Twain, Helen Keller, Marie Curie). Each figure answers in their own voice, with a verbatim passage from their public-domain writings and a plain-English explanation.

### 1.2 Tech Stack and Versions

| Layer | Choice |
| --- | --- |
| Runtime | Node.js 20 LTS |
| Framework | Next.js 15 (App Router), React 19, TypeScript 5 in strict mode |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers under `src/app/api` |
| Database | PostgreSQL 16 with pgvector, Prisma ORM; Neon in production, `pgvector/pgvector:pg16` Docker image locally and in CI |
| Embeddings | Voyage AI `voyage-3-lite` (1024 dimensions), server side only. The Claude API does not create embeddings |
| Auth | JWT signed with `jose`, stored in an httpOnly cookie; passwords hashed with `bcryptjs` |
| Real-time | Server-Sent Events (SSE) from Route Handlers |
| AI | Claude API through `@anthropic-ai/sdk`, server side only |
| Validation | `zod` for every request body, query, and env variable |
| Testing | Vitest + React Testing Library (unit/integration), Playwright (E2E) |
| CI/CD | GitHub Actions, Vercel (preview per PR, production on `main`) |

Environment variables (all server only, validated with zod in `src/lib/env.ts`): `DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `AI_PROVIDER` (`live` or `mock`).

### 1.3 Architecture Overview

```
src/
  middleware.ts             # Redirects signed-out users to sign-in (Edge runtime)
  app/                      # Routes only (pages, layouts, route handlers)
    (auth)/sign-in/         # Public pages
    themes/
    roundtable/[id]/
    notebook/
    curator/                # Curator-only pages
    admin/                  # Admin-only pages
    api/                    # Route handlers: api/<resource>/route.ts
  components/
    ui/                     # Generic primitives (Button, Dialog)
    roundtable/             # AnswerCard, PassageBlock, PlainExplanation, ...
    themes/                 # ThemePicker, FigureSuggestion
  server/
    db.ts                   # The single shared Prisma client
    services/               # Business logic (roundtableService.ts, ...)
    auth/                   # Session, JWT, requireRole()
    ai/                     # Claude client and prompt builders
    retrieval/              # pgvector passage search
  lib/                      # Shared pure helpers and zod schemas
  types/                    # Shared TypeScript types
prisma/
  schema.prisma
  seed.ts
e2e/                        # Playwright specs
docs/
  prd.md                    # PRD (source of user stories)
  design/                   # Mockups
  api/openapi.yaml          # OpenAPI spec
```

Key patterns:

- Route handlers stay thin: validate input with zod → check auth/role → call a service → return a response.
- All business logic lives in `src/server/services`. Components and route handlers never call Prisma directly. Import the Prisma client only from `src/server/db.ts`.
- `src/middleware.ts` runs on the Edge runtime: it verifies the JWT with `jose` and redirects; it never imports Prisma or `bcryptjs`.
- Passage embeddings are stored in a column declared as `Unsupported("vector(1024)")` in `schema.prisma`. Similarity search lives only in `src/server/retrieval` and uses `prisma.$queryRaw` tagged templates, because Prisma's query API cannot run vector search.
- A figure's voice and a figure's sources are separate. The figure's persona notes (`Figure.voiceNotes`) shape how they speak. Passages come only from retrieval: Claude picks one retrieved candidate by its ID (or none), and the UI renders the stored text for that ID, never text from the model.
- Streaming route handlers set `export const runtime = "nodejs"` and `export const maxDuration = 60` so parallel answers are not cut off by the Vercel function timeout.
- Server Components by default. Add `"use client"` only to components that need state, effects, or event handlers.
- API responses use one shape: `{ data: ... }` on success, `{ error: { code, message } }` on failure, with the correct HTTP status (400, 401, 403, 404, 429, 500).
- Role checks use `requireRole("curator" | "admin")` on the server, never only in the UI.

### 1.4 Naming Conventions and Coding Standards

| Item | Convention | Example |
| --- | --- | --- |
| React components | PascalCase file, one component per file, named export | `AnswerCard.tsx` → `export function AnswerCard` |
| Hooks | `use` + camelCase | `useRoundtableStream.ts` |
| Services and helpers | camelCase file | `roundtableService.ts` |
| Route folders | kebab-case | `app/api/flagged-answers/route.ts` |
| Prisma models | PascalCase singular; fields camelCase | `Figure`, `Passage.sourceTitle` |
| Constants | UPPER_SNAKE_CASE | `DAILY_ROUNDTABLE_LIMIT` |
| Tests | Same name as the file + `.test.ts(x)`, next to it | `AnswerCard.test.tsx` |

- TypeScript strict mode; never use `any`. Exported functions have explicit return types.
- Styling with Tailwind classes only. The one exception is the per-figure accent color, passed as a CSS variable.
- No commented-out code and no `console.log` in committed code.

### 1.5 Testing Strategy

- Follow TDD (red → green → refactor). Write the failing test first and commit it as `test(...)`, then commit the implementation as `feat(...)` or `fix(...)`.
- Every acceptance criterion in the issue maps to at least one test.
- Unit tests (Vitest): services, helpers, zod schemas, and components (React Testing Library, queried by role and label, not by class name).
- Integration tests (Vitest): route handlers against a Postgres + pgvector test database (the Docker image locally, a GitHub Actions service container in CI), reset between test files.
- E2E tests (Playwright): sign in, start a roundtable, save to notebook.
- Never call the real Claude or Voyage APIs in tests. Unit and integration tests mock `src/server/ai`; E2E tests run the app with `AI_PROVIDER=mock`, which returns fixture streams and embeddings.
- Test names describe behavior: `it("shows a retry button when the stream fails")`.
- Coverage goal: 80% lines for `src/server` and `src/lib`.

---

## 2. PRD and Design References

### 2.1 PRD

- Location: `docs/prd.md`.
- User stories are numbered US-1 to US-9. Every issue names the user story it comes from; read that story's acceptance criteria before coding.
- Content policy from the PRD is mandatory: passages are shown verbatim from uploaded public-domain works, never generated, and the UI states that answers are AI interpretations.

### 2.2 Mockup

- Location: `docs/design/roundtable-mockup.html` (open it in a browser).
- Screen: the roundtable page (US-3, US-4). Theme selection, follow-ups, and the notebook are not in this mockup yet.
- Visual style: playful, hand-drawn, and simple. White page with a faint grid floor, flat colors, slightly wobbly outlines (SVG turbulence filter). No gradients and no generic rounded-card dashboard look.
- Layout, top to bottom: back button and page title; theme pill and the user's question; the table scene; the "Ask the table anything…" input; the answer cards (3 columns on desktop, 1 column under 900px); a disclaimer line.
- Table scene: one SVG with a round pedestal table. Each figure's hand-drawn avatar sits in a white circle around the table with their name below. Each figure has a cup; a cake plate sits in the center; a coffee pot sits on the table.
- Table interactions: pick up the coffee pot or the cake, then choose a figure's cup to serve them; the figure replies in a short speech bubble. Clicking an avatar scrolls to that figure's answer card. Every interactive part of the scene is focusable and works with Enter and Space.
- Speech bubbles: typing dots while the answer streams, then the answer's first sentence. Hidden under 640px.
- Design tokens:

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| Paper | `#ffffff` | `#17181d` | Page and cards |
| Ink | `#232323` | `#f1f1f1` | Main text, card borders |
| Muted | `#6b6b6b` | `#a9abb3` | Secondary text |
| Line | `#e6e6e6` | `#33353d` | Dividers, bubble borders |
| Table | `#f2efea` | `#2c2b2e` | Tabletop |
| Action blue | `#2d5be3` | `#7d9cff` | Send button, focus ring |
| Twain accent | `#2f6f5e` | `#2f6f5e` | Figure color |
| Keller accent | `#7d4a92` | `#7d4a92` | Figure color |
| Curie accent | `#2a64a8` | `#2a64a8` | Figure color |

- Fonts: Bricolage Grotesque (title, figure names, the question), Figtree (UI and answer text), Literata italic (original passages only).

### 2.3 Key UI Components and Expected Behavior

| Component | Expected behavior |
| --- | --- |
| `RoundtableQuestion` | Shows the theme as a pill and the question as the page heading. |
| `TableScene` | Renders the table, avatars, cups, cake, and coffee pot. Owns the serve state: `holding` is `"pot"`, `"cake"`, or `null`. |
| `FigureAvatar` | Hand-drawn SVG avatar for one figure; reused in the scene and in answer cards. |
| `SpeechBubble` | Typing dots while streaming, the answer's first sentence when complete, a short reply after being served. |
| `AskBar` | Input with placeholder "Ask the table anything…"; send is disabled until the question has 10+ characters; max 1000. |
| `AnswerCard` | Props: `figure`, `status`, `answer`, `passage?`, `explanation?`. `status` is one of `streaming`, `complete`, `failed`, `noPassage`. Hand-drawn border; header shows the figure's avatar, name, and field/country/years. |
| `AnswerCard` streaming | Text grows as SSE chunks arrive; a placeholder shows where the passage will appear; action buttons are disabled; answer region has `aria-live="polite"`. |
| `AnswerCard` failed | Shows "\[Name\]'s answer stopped before it finished. The other answers are not affected." with `role="alert"` and a "Retry this answer" button. Other cards keep streaming. |
| `AnswerCard` noPassage | Shows the answer plus a notice that no passage closely matches; never shows a made-up quote. |
| `PassageBlock` | Styled as a paper slip (slight tilt, left border in the figure's accent). `<blockquote>` in Literata italic with the verbatim passage and a caption "Title, Year, Location" (e.g., "Pudd'nhead Wilson, 1894, Chapter 12"). |
| `PlainExplanation` | Heading "In plain English" followed by 1–2 short sentences. |
| `ThemePicker` / `FigureSuggestion` | US-2: list themes, show 3 suggested figures, allow swapping one, allow manual pick of 2–3. Not in the mockup yet; design it in the same hand-drawn style when US-2 starts. |

Button labels are exact and stay the same across the app. In the current mockup: "Flag", "Retry this answer". Added by later stories: "Ask a follow-up" (US-5), "Save passage" (US-6). Do not add buttons for stories that are not in the current issue.

### 2.4 User Flows

Implement features so they fit these flows:

1. Start a roundtable: sign in → Themes → pick a theme → see 3 suggested figures → optionally swap one → type a question (10–1000 characters) → "Start roundtable" → answers stream in parallel → roundtable is saved to history automatically.
2. Follow up: on an answer card, "Ask a follow-up" → 1:1 thread with that figure, keeping the original question as context.
3. Save: "Save passage" on a card → item appears at the top of the Notebook.
4. Flag: "Flag" on a card → answer enters the curator review queue.
5. Daily limit reached: starting a roundtable returns 429 → UI shows the limit message and reset time.

---

## 3. Scrum and Workflow

### 3.1 Issues and Board

- Every change starts from a GitHub issue on the SageTable P2 Board.
- Move the card: In Progress when the branch is created, In Review when the PR is opened, Done when it is merged.

### 3.2 Branch Naming

`<type>/<issue-number>-<short-kebab-description>`

- Types: `feature`, `fix`, `chore`, `docs`, `test`.
- Example: `feature/4-answer-card-passage`.

### 3.3 Commit Message Format

`<type>(<scope>): <summary> (#<issue>)`

- Types: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `style`.
- Imperative mood, lowercase, no trailing period, max 72 characters, English only.
- Example: `test(roundtable): add failing tests for passage block (#4)` followed by `feat(roundtable): render passage block with source caption (#4)`.
- One logical change per commit.
- Commits are authored by the human partner doing the work. Never add AI co-author trailers or "generated by" lines.

### 3.4 Pull Request Workflow

- PR title follows the commit format. PR body includes `Closes #<issue>`, a short summary, how it was tested, and screenshots for UI changes.
- CI must pass. The other partner reviews and approves before merge.
- Merge with a merge commit, not squash, so the failing-test commits stay visible in history.
- Delete the branch after merge.

### 3.5 Referencing Issues in Code

- Commits and PRs always reference the issue number.
- A TODO must reference an issue: `// TODO(#12): handle retry backoff`. No bare TODOs.

---

## 4. Do's and Don'ts

### 4.1 Patterns

Do:

- Keep components small and typed; pass data in through props.
- Put shared types in `src/types` and zod schemas in `src/lib`.
- Handle loading, empty, and error states for every data-driven view.
- Reuse existing components before creating new ones.

Don't:

- Don't fetch data or call Prisma inside client components.
- Don't duplicate business rules in the UI; the server is the source of truth.
- Don't add a new folder pattern that isn't in section 1.3.
- Don't generate text and present it as an original passage.

### 4.2 Dependencies

- Prefer: `zod`, `jose`, `bcryptjs`, `@anthropic-ai/sdk`, `voyageai`, `server-only`, Prisma, React Testing Library, native `fetch`, `Intl` for dates.
- Avoid: UI kits (MUI, Chakra, Bootstrap), `axios`, `moment`, Redux.
- Ask before adding any dependency not listed here, and state why it is needed.

### 4.3 Security

- Secrets live only in environment variables, validated with zod at startup. Never commit `.env*` files.
- Every module in `src/server` starts with `import "server-only"`, so the build fails if client code imports it.
- The Claude and Voyage API keys are server only; never prefix them with `NEXT_PUBLIC_`.
- Validate every request with zod; return 400 on invalid input.
- Enforce roles on the server for every curator and admin route; return 403 otherwise.
- Services always filter user data by the signed-in `userId`. Requests for another user's roundtable or notebook item return 404, not 403, so they do not reveal that it exists.
- Auth cookies are `httpOnly`, `Secure`, `SameSite=Lax`.
- Use Prisma's query API. The only raw SQL is `prisma.$queryRaw` tagged templates in `src/server/retrieval` (parameterized). Never use `$queryRawUnsafe` or `$executeRawUnsafe`.
- Never log passwords, tokens, or API keys.
- Enforce the daily roundtable limit on the server; return 429 with the reset time.

### 4.4 Accessibility

- Target WCAG 2.1 AA.
- Use semantic HTML (`main`, `nav`, `article`, `blockquote`, real `button` elements).
- Every interactive element is keyboard reachable with a visible focus style.
- Streaming answers use `aria-live="polite"`; errors use `role="alert"`.
- Icon-only or ambiguous buttons get an `aria-label` that names the figure (e.g., "Flag Mark Twain's answer as inaccurate").
- Respect `prefers-reduced-motion`.
- Text meets 4.5:1 contrast in both light and dark themes.