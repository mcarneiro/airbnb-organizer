# Stayoo Development Guide

## Product

Stayoo is a Brazilian short-term rental management application. It tracks reservations and expenses, calculates monthly rental taxes, and stores user data in Google Sheets.

## Architecture

- Google Sheets is the persistent source of truth. Use `GoogleSheetsService.ts` for Sheets API access.
- Redux Toolkit slices own feature state. `useDataSync.ts` loads data at startup and `store/middleware/syncListener.ts` persists mutations with its established debounce.
- Keep tax rules in calculator services such as `BrazilianRentalTaxCalculator.ts`. Do not put tax logic in components or slices.
- Add all Google Sheets row and API types to `src/types/index.ts`. Do not use `any`.
- Use `react-i18next` for all user-facing text and Tailwind CSS for styling. Preserve the mobile-first UI.

## Development Workflow

- Start with a failing Vitest test for a feature or bug fix. Use Given/When/Then comments in tests.
- Add a reproduction test for every bug fix. Prioritize tests for tax services, utilities, and sync behavior.
- Run `npm run lint`, `npx tsc --noEmit`, and relevant `npm test` tests after changes.
- Keep `README.md` and `prd.md` accurate when product behavior changes.

## Security

- Never log, commit, or expose OAuth tokens, client secrets, spreadsheet IDs, or `.env` values.
- Keep Google OAuth scopes and Sheets access limited to what the feature requires.

## Git

- Use clear conventional commit messages such as `feat:`, `fix:`, and `refactor:`.

## Agent skills

### Issue tracker

Issues and specs live as Markdown files in `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default five canonical triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

Uses a single-context layout. See `docs/agents/domain.md`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).


<!-- headroom:rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /headroom:rtk-instructions -->
