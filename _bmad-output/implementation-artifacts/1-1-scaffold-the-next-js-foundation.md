---
baseline_commit: NO_VCS
---

# Story 1.1: Scaffold the Next.js foundation

Status: review

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

- [x] Task 1: Scaffold the app (AC: 1)
  - [x] Run `create-next-app@latest` with non-interactive flags: TypeScript, App Router, ESLint, Tailwind CSS, no `src/` dir, import alias `@/*`. (Scaffolded to a temp dir and merged into the root, because `create-next-app` refuses to run in a dir already containing `_bmad/` / `_bmad-output/`.)
  - [x] Next.js 16.2.10, React 19.2.4, Turbopack default, Node 26 (≥20).
  - [x] Verified `npm run dev` serves the default page at `localhost:3000` (HTTP 200).
- [x] Task 2: Establish the agreed repo structure (AC: 2)
  - [x] Created `lib/scorer/`, `lib/security/`, `data/`, `scripts/pipeline/`.
  - [x] Added `.gitkeep` to each empty dir so it is tracked.
  - [x] No scorer/security/pipeline/data logic implemented — skeleton dirs only.
- [x] Task 3: Verify tooling (AC: 3)
  - [x] `npm run lint` passes (no errors).
  - [x] `npm run build` passes (compiled + static generation, exit 0).
- [x] Task 4: Git + docs (AC: 4)
  - [x] `.gitignore` covers `/node_modules`, `/.next/`, `.env*` (from the scaffold default).
  - [x] Wrote a CareerStar `README.md` (description + how to run) and renamed the package to `careerstar`.
  - [x] `git init` + initial commit `9dbee30`.

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

claude-opus-4-8 (BMAD dev-story)

### Debug Log References

- `npm install` initially failed with `ENOSPC` (disk 100% full, ~156 MB free). Resolved by removing the broken partial `node_modules` and clearing the 2 GB npm cache (`npm cache clean --force`) → ~2.3 GB free, then reinstalled successfully.
- `npm` blocked post-install scripts for `sharp` and `unrs-resolver` (newer npm default). Not blocking — `next build` and lint both pass; `sharp` only affects production image optimization, revisit if `next/image` optimization is needed.

### Completion Notes List

- Scaffolded Next.js 16.2.10 (App Router, TypeScript, Tailwind, Turbopack) via `create-next-app`; merged into the project root alongside the existing `_bmad/` folders.
- Created the repo skeleton (`lib/scorer`, `lib/security`, `data`, `scripts/pipeline`) with `.gitkeep`.
- Verified all ACs: dev server → HTTP 200; `lint` clean; `build` exit 0; git repo initialized with initial commit and `.gitignore` excluding `node_modules`/`.next`/`.env*`.
- Ultimate context engine analysis completed — comprehensive developer guide created.

### File List

- `package.json` (new, name = careerstar), `package-lock.json` (new)
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `next-env.d.ts` (new)
- `app/` — `layout.tsx`, `page.tsx`, `globals.css`, `favicon.ico` (new, scaffold defaults)
- `public/` (new, scaffold assets)
- `README.md` (rewritten for CareerStar), `.gitignore`, `AGENTS.md`, `CLAUDE.md` (new)
- `lib/scorer/.gitkeep`, `lib/security/.gitkeep`, `data/.gitkeep`, `scripts/pipeline/.gitkeep` (new)

### Change Log

- 2026-07-08: Scaffolded CareerStar Next.js 16 foundation; all ACs verified; initial commit `9dbee30`. Status → review.
