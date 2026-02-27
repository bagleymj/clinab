# clinab — CLI for You Need A Budget

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## Project Overview
A TypeScript CLI built with Bun for interacting with the YNAB (You Need A Budget) API.
Designed to be delightful for both humans (colorful tables) and AI agents (JSON output).

## Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **CLI Framework**: Commander.js
- **Output**: chalk (colors) + cli-table3 (tables)
- **Testing**: Bun test runner
- **Dev Environment**: NixOS + direnv (flake.nix + .envrc)

## Project Structure
```
src/
  index.ts           # CLI entry point
  api/               # YNAB API client wrappers
    client.ts        # HTTP client with auth & error handling
    budgets.ts       # Budget endpoints
    accounts.ts      # Account endpoints
    categories.ts    # Category endpoints
    transactions.ts  # Transaction endpoints
    payees.ts        # Payee endpoints
    months.ts        # Month endpoints
    scheduled.ts     # Scheduled transaction endpoints
    user.ts          # User endpoints
  commands/          # CLI command definitions
  formatters/        # Output formatting (tables, JSON, currency)
  types/             # TypeScript type definitions
tests/
  api/               # API client unit tests
  commands/          # Command unit tests
  formatters/        # Formatter unit tests
  integration/       # Live API integration tests
```

## Key Conventions
- All YNAB monetary values are in "milliunits" (1000 = $1.00)
- Use `amountToMilliunits()` and `milliunitsToAmount()` for conversion
- Every command supports `--json` for machine-readable output
- Budget can be selected by name or ID via `-b` / `--budget`
- Token via `YNAB_TOKEN` env var or `--token` flag
- Commands that accept name-or-ID arguments resolve names to IDs automatically

## Testing
- `bun test` — run all tests
- `bun test tests/api` — unit tests only
- `bun test tests/integration` — live API tests (requires YNAB_TOKEN)
- DevPlan budget is the ONLY budget used for testing. NEVER modify other budgets.
- DevPlan budget ID: 77d887b7-cc1d-4395-8e67-3c166dc5b04c

## YNAB API
- Base URL: https://api.ynab.com/v1
- Auth: Bearer token in Authorization header
- Docs: https://api.ynab.com
- Rate limit: 200 requests per hour
