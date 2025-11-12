# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` — CLI entry (`src/cli.ts`), subcommands in `src/commands/`, helpers in `src/utils/`.
- Tests: `tests/` — specs under `tests/specs/`, fixtures in `tests/fixtures/`, runner at `tests/index.ts`.
- Build output: `dist/` — compiled `.mjs` shipped via `bin` (`aicommit`, `aic`).
- Config: optional project-level `.ai-commit.json` at repo root to add context and override defaults.

## Build, Test, and Development Commands
- `npm run build` — bundle TypeScript with `pkgroll` and minify to `dist/`.
- `npm test` — run test suite with `tsx` + `manten`.
- `npm run lint` — lint codebase with ESLint (`@typescript-eslint`).
- `npm run type-check` — TypeScript type checking without emit.

Example local workflow:
```
npm ci
npm run lint && npm run type-check
npm test
npm run build
```

## Coding Style & Naming Conventions
- Language: TypeScript (ESM). Prefer explicit exports; avoid default exports in new code.
- Indentation: spaces; 4 spaces per `.editorconfig` (YAML uses 2).
- Linting: ESLint with `@typescript-eslint` (see `.eslintrc.cjs`). Fix or justify warnings.
- Names: `kebab-case` files for CLIs/commands (e.g., `prepare-commit-msg-hook.ts`), `camelCase` functions, `PascalCase` types.
- Paths: keep new commands in `src/commands/` and utilities in `src/utils/`.

## Testing Guidelines
- Frameworks: `manten` test runner; executed via `tsx`.
- Location: place new specs in `tests/specs/` mirroring `src/` paths.
- Names: prefer descriptive test names; one behavior per `it`.
- Run: `npm test`. Aim to keep tests hermetic; use `tests/fixtures/` for filesystem cases.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`, `chore: ...`). Keep subject ≤ 72 chars; imperative mood.
- PRs: include a clear description, linked issues (`Closes #123`), and before/after output for CLI-facing changes. Add test coverage for new behavior.
- Scope small and focused; update README or inline help when user-facing changes occur.

## Security & Configuration Tips
- Do not commit secrets. Configure API keys with `aicommit config set OPENAI_KEY=...` (not `.env`).
- If adding new configuration, document keys in README and support overrides via `.ai-commit.json`.
