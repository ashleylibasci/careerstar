---
baseline_commit: NO_VCS
---

# Story 1.1: Scaffold the Next.js foundation

Status: in-progress

<!-- First story of Epic 1 (Live Walking Skeleton). Greenfield starter per Architecture Spine AD-1. -->

## Story

As a developer,
I want a fresh Next.js 16 app scaffolded with the agreed repo structure,
so that all future CareerStar work builds on a consistent, conventional foundation.

## Acceptance Criteria

1. **Given** an empty project, **When** the app is scaffolded with `create-next-app@latest` (App Router, TypeScript, Node 20+), **Then** it runs locally at `http://localhost:3000` showing the default page with no errors.
2. **Given** the scaffolded app, **When** I inspect the repo, **Then** the agreed top-level directories exist: `app/`, `lib/`, `data/`, `scripts/` (empty dirs carry a `.gitkeep`).
3. **Given** the project, **When** I run the lint/build scripts, **Then** `npm run lint` and `npm run build` complete without errors.
4. **Given** the project, **When** work is committed, **Then** it is a git repository with a sensible `.gitignore` (ignoring `node_modules/`, `.next/`, `.env*`) and an initial commit, and a short `README.md` names the project and how to run it.

## Tasks / Subtasks

- [ ] Task 1: Scaffold the app (AC: 1)
  - [ ] Run `npx create-next-app@latest .` (in the project root) with non-interactive flags: TypeScript, App Router, ESLint, Tailwind CSS, no `src/` dir, import alias `@/*`.
  - [ ] Suggested command: `npx create-next-app@latest . --ts --app --eslint --tailwind --no-src-dir --import-alias "@/*"` (Turbopack is the default bundler in Next.js 16; ensure Node 20+).
  - [ ] Verify `npm run dev` serves the default page at `localhost:3000`.
- [ ] Task 2: Establish the agreed repo structure (AC: 2)
  - [ ] Create top-level dirs: `lib/` (with `lib/scorer/` and `lib/security/` subdirs), `data/`, `scripts/` (with `scripts/pipeline/`).
  - [ ] Add a `.gitkeep` to each otherwise-empty dir so it is tracked.
  - [ ] Do NOT implement any scorer, security, pipeline, or data logic yet — those are later stories. This story only creates the skeleton dirs.
- [ ] Task 3: Verify tooling (AC: 3)
  - [ ] Confirm `npm run lint` passes.
  - [ ] Confirm `npm run build` passes.
- [ ] Task 4: Git + docs (AC: 4)
  - [ ] Ensure `.gitignore` covers `node_modules/`, `.next/`, `.env*`, build output.
  - [ ] Write a minimal `README.md`: project name (CareerStar), one-line description, "how to run" (`npm install`, `npm run dev`).
  - [ ] `git init` (if needed) and make an initial commit.

## Dev Notes

### What this story is (and is NOT)
- This is the **greenfield scaffold** — the foundation only. It stands up a running, empty Next.js app with the directory skeleton in place. It does **not** build the UI, the scorer, the data pipeline, the LLM layer, or deploy anything. Those are Stories 1.2 → 1.4 and Epics 2–5.
- Keep it boring and clean. The value here is a correct, conventional starting point that every later story depends on.

### Stack (verified current — mid-2026)
- **Next.js 16.2.x**, **App Router** (the only default; do NOT use the legacy Pages Router / `pages/api`). Backend logic will live in **Route Handlers** (`app/api/*/route.ts`) in later stories.
- **TypeScript**, **React 19.2**, **Node.js 20+** (required minimum).
- **Turbopack** is the default bundler in v16 (dev + build) — no extra config needed.
- Scaffold via `create-next-app@latest`. Middleware, if ever needed, is `proxy.ts` in v16 (not needed this story).
- **Tailwind CSS** included at scaffold for fast, consistent styling of the score cards later (beginner-friendly, standard default). If you prefer plain CSS modules, that's acceptable — but pick one now and be consistent.

### Repo structure to create (from Architecture Spine, AD-1/AD-2/AD-3/AD-5)
```
app/                # UI + Route Handlers (scaffolded by create-next-app)
lib/
  scorer/           # (later) pure deterministic scoring module — AD-2
  security/         # (later) input validation, rate limiting, prompt assembly — AD-5
data/               # (later) committed data.json artifact — AD-3
scripts/
  pipeline/         # (later) offline BLS+O*NET+Eloundou join — AD-3
```
Create the dirs now (with `.gitkeep`); leave them empty otherwise.

### Testing standards
- No app logic exists yet, so no unit tests are required in this story. The bar is: `npm run dev`, `npm run lint`, and `npm run build` all succeed. A real test harness (for the scorer) arrives with Story 2.2.

### Project Structure Notes
- Root-level app (no `src/` dir) matches the spine's repo shape. Import alias `@/*` maps to the project root.
- Do not add a database, ORM, or state store — CareerStar is **stateless** (AD-6). None is needed now or later.

### References
- [Source: ARCHITECTURE-SPINE.md#Seed] — Next.js 16.2.x (App Router, Turbopack, Node 20+), `create-next-app@latest`, repo shape.
- [Source: ARCHITECTURE-SPINE.md#AD-1] — one app, one language (TypeScript, Route Handlers).
- [Source: epics.md#Epic-1-Story-1.1] — acceptance criteria this story satisfies.

## Dev Agent Record

### Agent Model Used

_(to be filled by dev-story)_

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.

### File List
