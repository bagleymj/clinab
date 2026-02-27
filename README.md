# clinab

A delightful CLI for [You Need A Budget (YNAB)](https://www.ynab.com).
Designed for both humans and AI agents.

## Features

- **Budgets** — List all budgets, view settings, select by name or ID
- **Accounts** — List, show, and create checking, savings, credit cards, and more
- **Categories** — List groups/categories, set budgets, create/update categories and groups
- **Transactions** — Full CRUD: create, list, filter, update, delete, import
- **Payees** — List, show, rename payees; view payee locations
- **Months** — View monthly summaries and detailed category breakdowns
- **Scheduled Transactions** — Create, list, show, and delete recurring transactions
- **User** — View authenticated user information

### Output Modes

- **Human mode** (default): Colorful tables with currency formatting
- **JSON mode** (`--json`): Machine-readable output for scripting and AI agents

### Smart Resolution

All commands accept names or UUIDs for budgets, accounts, categories, and payees.
Names are resolved case-insensitively.

## Installation

### NixOS (with flakes)

```bash
# Run directly
nix run .

# Development shell
nix develop
# or with direnv:
direnv allow
```

### Manual

```bash
bun install
bun run src/index.ts --help
```

## Authentication

Get your YNAB API token at https://app.ynab.com/settings/developer

```bash
# Set environment variable
export YNAB_TOKEN="your-token-here"

# Or pass directly
clinab --token "your-token" budgets list
```

On NixOS with agenix, the token is auto-loaded from `/run/agenix/ynab-token`.

## Usage

```bash
# List all budgets
clinab budgets list

# Work with a specific budget (by name)
clinab -b "My Budget" accounts list

# Create an account
clinab -b "My Budget" accounts create "Checking" checking 5000

# View categories with budget amounts
clinab -b "My Budget" categories list

# Set a category budget
clinab -b "My Budget" categories budget "Groceries" 500

# Add a transaction (negative = outflow)
clinab -b "My Budget" txn add -a "Checking" -p "Costco" -c "Groceries" -m "Weekly shop" -- -85.50

# List transactions with filters
clinab -b "My Budget" txn list --since 2026-01-01 --account "Checking"

# View monthly summary
clinab -b "My Budget" months show current

# Create a scheduled transaction
clinab -b "My Budget" sched add -a "Checking" -p "Landlord" -f monthly -c "Rent" -- -1200

# JSON output for scripting
clinab --json -b "My Budget" txn list

# Pipe to jq for processing
clinab --json -b "My Budget" accounts list | jq '.[].balance'
```

## Command Reference

| Command | Alias | Description |
|---------|-------|-------------|
| `budgets list` | | List all budgets |
| `budgets settings` | | Show budget date/currency settings |
| `accounts list` | | List accounts (--include-closed) |
| `accounts show <name>` | | Show account details |
| `accounts create <name> <type> <bal>` | | Create a new account |
| `categories list` | `cat list` | List all categories |
| `categories show <name>` | `cat show` | Show category details |
| `categories budget <name> <amt>` | `cat budget` | Set monthly budget |
| `categories create <name> -g <group>` | `cat create` | Create a category |
| `categories create-group <name>` | `cat create-group` | Create a group |
| `categories update <name>` | `cat update` | Update category name/note |
| `categories update-group <group>` | `cat update-group` | Rename a group |
| `transactions list` | `txn list` | List transactions |
| `transactions show <id>` | `txn show` | Show transaction details |
| `transactions add <amount>` | `txn add` | Create a transaction |
| `transactions update <id>` | `txn update` | Update a transaction |
| `transactions delete <id>` | `txn delete` | Delete a transaction |
| `transactions import` | `txn import` | Import linked transactions |
| `payees list` | | List all payees |
| `payees show <name>` | | Show payee details |
| `payees rename <name> -n <new>` | | Rename a payee |
| `payees locations` | | Show payee locations |
| `months list` | | List budget months |
| `months show <month>` | | Show month details |
| `scheduled list` | `sched list` | List scheduled transactions |
| `scheduled show <id>` | `sched show` | Show scheduled details |
| `scheduled add <amount>` | `sched add` | Create scheduled transaction |
| `scheduled delete <id>` | `sched delete` | Delete scheduled transaction |
| `user` | | Show authenticated user info |

### Global Options

| Option | Description |
|--------|-------------|
| `-t, --token <token>` | YNAB API token (default: `$YNAB_TOKEN`) |
| `-b, --budget <budget>` | Budget name or ID (default: `last-used`) |
| `--json` | JSON output for scripting & AI agents |
| `--base-url <url>` | Override API base URL |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

### Account Types

`checking`, `savings`, `cash`, `creditCard`, `lineOfCredit`, `otherAsset`,
`otherLiability`, `mortgage`, `autoLoan`, `studentLoan`, `personalLoan`,
`medicalDebt`, `otherDebt`

### Scheduled Transaction Frequencies

`never`, `daily`, `weekly`, `everyOtherWeek`, `twiceAMonth`, `every4Weeks`,
`monthly`, `everyOtherMonth`, `every3Months`, `every4Months`, `twiceAYear`,
`yearly`, `everyOtherYear`

## Testing

```bash
# All tests
bun test

# Unit tests only
bun test tests/formatters

# API tests (requires YNAB_TOKEN)
bun test tests/api
```

## Development

Built with [Bun](https://bun.sh), [Commander.js](https://github.com/tj/commander.js),
[chalk](https://github.com/chalk/chalk), and [cli-table3](https://github.com/cli-table/cli-table3).

## License

MIT
