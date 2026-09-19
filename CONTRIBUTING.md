# Contributing

Thanks for contributing to the **MIBP fork** of [decolua/9router](https://github.com/decolua/9router).
Before editing anything, read [`AGENTS.md`](AGENTS.md) — it lists hard guardrails
(npm-10 lockfile, test-DB isolation, fork-only features) that are easy to
silently break. [`CLAUDE.md`](CLAUDE.md) has the full developer cheat-sheet.

## Requirements

- **Node.js 22 or newer** (the Docker image pins `node:22-alpine` by digest).
- npm 10.9.8 when regenerating `package-lock.json` (see `AGENTS.md` §1 — never
  regenerate with npm 11+, it breaks the Docker `npm ci` build).

## Setup

```bash
npm install                 # root deps (src/ imports need open, undici, etc.)
cd tests && npm install     # the tests/ package has its own deps (vitest)
```

## Common commands (repo root)

```bash
npm run dev       # Next dev server on http://localhost:20127
npm run build     # production build (--webpack)
npm run start     # serve the built app via custom-server.js
npm run verify:lockfile   # must pass before any Docker release
```

## Testing

Run from the `tests/` directory (vitest lives there, as an independent package):

```bash
npx vitest run                              # everything
npx vitest run unit/<name>.test.js          # a single file
```

- The suite is **not** expected to be all-green on a plain checkout — judge
  only for **new** regressions (see `CLAUDE.md` and
  `tests/__baseline__/known-fails.txt`).
- Tests must **never** write to the real `~/.9router` database. Keep
  `tests/setup/isolateDataDir.js` wired into `tests/vitest.config.js`
  (`AGENTS.md` §2). `RUN_REAL=1` opts back in for live-credential suites.
- After touching provider registry / aliases / OAuth URLs, also run the
  baseline verifiers in `tests/__baseline__/`.

## Code conventions

- ESM modules; `"use client"` at the top of any component that runs in the
  browser.
- **Do not call browser `crypto.randomUUID()` directly.** Web Crypto's
  `randomUUID` only exists in secure contexts (HTTPS / `localhost`), so the
  dashboard breaks over plain-HTTP LAN access. Reuse the uuid-backed
  `generateId` from `@/shared/utils` instead (server code may import
  `node:crypto` freely).
- Prefer the smallest change; reuse existing helpers and keep new dependencies
  out unless strictly required.

## Upstream sync

Follow `AGENTS.md` §6: work on a branch, tag a rollback point, **merge** (do
not rebase) `upstream/master`, and re-verify build + tests + baseline scripts.
Fork-only features listed in `AGENTS.md` §5 must survive conflict resolution.

## Documentation requirements

- Keep `README.md` in sync with setup/usage, and update affected docs in
  `docs/` with any behavior change.
- Record decisions, discoveries, and test results in `session.md` at the end
  of each task.
- `CHANGELOG.md` mirrors upstream and is not edited by the fork.
