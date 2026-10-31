# SageTable — Product Requirements Document

Team: Xinyu Li, Bo Pang
Version: 1.0

## 1. Overview

SageTable lets users bring a real question to a roundtable of great figures from different countries and fields, such as Leonardo da Vinci, Marie Curie, Vincent van Gogh, Mark Twain, and Helen Keller. Each figure answers in their own voice, grounded in an original passage from their public-domain writings, with a plain-English explanation. Users learn real ideas through a problem they care about.

## 2. Problem

Great figures faced failure, doubt, and hard choices, and wrote about it in letters, diaries, and books. Today these writings are hard to read: the language is old, and it is unclear how the stories apply to our lives. General AI chatbots give one neutral answer, so users cannot tell whose ideas they are or where they come from.

## 3. Target Users

Students and young professionals with little background in classic literature, philosophy, or art. They find original works dense and online explanations scattered. When facing a confusing moment or a hard choice, they want several distinct views from people who went through something similar, with real sources behind them.

## 4. User Roles

| Role | Description |
|---|---|
| User | Signs in, starts roundtables, asks follow-ups, saves to notebook |
| Curator | Manages figures, public-domain writings, and themes; reviews flagged answers |
| Admin | Manages user roles and daily usage limits |

## 5. User Stories and Acceptance Criteria

### US-1 Register and sign in
As a user, I want to register and sign in, so my conversations stay private.
- [ ] User can register with email and password (minimum 8 characters).
- [ ] Passwords are hashed and never stored in plain text.
- [ ] Signing in sets a JWT in an httpOnly cookie; signing out clears it.
- [ ] Unauthenticated users are redirected to sign-in when opening roundtables or the notebook.
- [ ] A user can only access their own roundtables and notebook items.

### US-2 Pick a theme and get suggested figures
As someone new to these figures, I want to pick a theme like "choosing a career" or "dealing with failure" and get a suggested group of figures, so I know where to start.
- [ ] Home page shows at least 5 themes.
- [ ] Selecting a theme shows a suggested group of 3 figures, each with name, field, era, and a one-line bio.
- [ ] User can swap a suggested figure for another figure linked to the theme before starting.
- [ ] User can skip themes and choose 2–3 figures manually.

### US-3 Roundtable answers side by side in real time
As someone facing a hard choice, I want 2–3 figures to answer my question side by side in real time, so I can compare different views.
- [ ] User submits a question of 10–1000 characters to 2–3 selected figures.
- [ ] Answers stream in parallel via Server-Sent Events, one card per figure.
- [ ] Each answer is written in first person, in the figure's voice.
- [ ] If one figure's stream fails, the others continue and the failed card shows a retry button.
- [ ] The completed roundtable is saved to the user's history automatically.

### US-4 Original passage with plain-English explanation
As someone who finds old texts hard to read, I want each answer to show the original passage with a plain-English explanation, so I understand the real source.
- [ ] Each answer shows at least one original passage retrieved from that figure's uploaded writings.
- [ ] Each passage shows its source title, year, and location (chapter, letter, or section).
- [ ] A plain-English explanation appears with each passage.
- [ ] If no passage passes the relevance threshold, the figure says so instead of inventing a quote.
- [ ] User can flag an answer as inaccurate.

### US-5 Follow-up questions with one figure
As a curious learner, I want to ask one figure follow-up questions, so I understand why they think that way.
- [ ] User can open a 1:1 follow-up thread from any figure's answer card.
- [ ] Follow-ups keep the context of the original question and that figure's earlier answer.
- [ ] Follow-up answers also cite original passages.

### US-6 Notebook
As a returning user, I want to save passages and past roundtables in my notebook, so I can review what I learned.
- [ ] User can save a single passage or a whole roundtable with one click.
- [ ] Notebook lists saved items newest first and can be filtered by figure and theme.
- [ ] User can remove a saved item.
- [ ] User can reopen a past roundtable and continue follow-ups.

### US-7 Curator content management
As a curator, I want to add figures, upload their public-domain writings, create themes, and fix answers that users flag, so the content stays accurate.
- [ ] Curator can create and edit figures (name, field, era, bio, voice notes).
- [ ] Curator can upload a .txt or .md text with source metadata; the system chunks and embeds it.
- [ ] Curator must confirm public-domain status for each uploaded work.
- [ ] Curator can create and edit themes and assign figures to them.
- [ ] Curator sees a review queue of flagged answers and can mark each resolved.
- [ ] Non-curators receive 403 on curator pages and endpoints.

### US-8 Admin roles and usage limits
As an admin, I want to manage user roles and set daily usage limits, so the platform stays secure and AI costs stay under control.
- [ ] Admin can view users and change their role (user, curator, admin).
- [ ] Admin can set a daily roundtable limit per role.
- [ ] A user who reaches the limit sees a clear message with the reset time; the API returns 429.
- [ ] Role changes are recorded with who changed what and when.

### US-9 Documented API endpoints
As a developer, I want documented API endpoints, so I can test how themes, figures, and roundtables work.
- [ ] API is documented in an OpenAPI spec and viewable through a Swagger UI page.
- [ ] Every endpoint is documented with method, path, auth requirement, and request/response examples.
- [ ] Documentation covers auth, themes, figures, roundtables, notebook, curator, and admin endpoints.
- [ ] Documented examples are checked against real responses by automated tests.

## 6. Sprint Plan

Final deadline: November 13, 2026. Both sprints are planned jointly by Xinyu Li and Bo Pang.

| Sprint | Dates | Goal | Product scope | Engineering scope |
|---|---|---|---|---|
| Sprint 1 | Oct 31 – Nov 6 | Core roundtable works end to end | US-1, US-2, US-3, US-4 | Project setup; database schema and seed data (5 figures, 5 themes, public-domain texts); CI running tests on every PR; Vercel deploy previews |
| Sprint 2 | Nov 7 – Nov 12 | Depth, content management, and release | US-5, US-6, US-7, US-8, US-9 | Multi-stage pipeline with security scanning; environment management; automated production deployment; README, architecture diagram, database schema diagram, setup guide; demo video |

Each issue carries a story-point estimate (1, 2, 3, 5, or 8) and one owner. Work is split so both partners own full-stack features and review each other's pull requests.

## 7. Non-Functional Requirements

- Security: role checks enforced on the server for every protected route; server-side input validation; Claude API key never exposed to the client; per-user rate limiting.
- Accessibility: WCAG 2.1 AA; full keyboard navigation; sufficient color contrast; streaming answers announced to screen readers.
- Performance: first streamed token appears within about 3 seconds under normal load.
- Testing: unit tests with Vitest; end-to-end tests with Playwright for sign-in, starting a roundtable, and saving to notebook; tests run in GitHub Actions on every pull request.

## 8. Content Policy

- Only public-domain works are uploaded; public-domain status is checked per work, not per figure.
- Text shown as an original passage must be retrieved verbatim from an uploaded work, never generated.
- The interface states that figure answers are AI interpretations inspired by their writings.

## 9. Out of Scope (Stretch Goals)

- Figures responding to each other.
- Artist roundtables showing public-domain artworks.
- Friends joining the same roundtable.

## 10. Tech Stack

Next.js, TypeScript, Tailwind CSS, Next.js API routes, PostgreSQL with pgvector and Prisma, JWT authentication, Server-Sent Events, Claude API, Vitest, Playwright, GitHub Actions, Vercel.
