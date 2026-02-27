#!/usr/bin/env bun
import { Command } from "commander";
import { initClient, YnabApiError } from "./api/client.ts";
import { resolveBudgetId } from "./api/budgets.ts";
import { setJsonMode } from "./formatters/output.ts";
import { printError } from "./formatters/output.ts";
import { budgetsCommand } from "./commands/budgets.ts";
import { accountsCommand } from "./commands/accounts.ts";
import { categoriesCommand } from "./commands/categories.ts";
import { transactionsCommand } from "./commands/transactions.ts";
import { payeesCommand } from "./commands/payees.ts";
import { monthsCommand } from "./commands/months.ts";
import { scheduledCommand } from "./commands/scheduled.ts";
import { userCommand } from "./commands/user.ts";

const VERSION = "0.1.0";

const program = new Command()
  .name("clinab")
  .version(VERSION)
  .description(
    `clinab — A delightful CLI for You Need A Budget (YNAB)

Manage your YNAB budgets, accounts, transactions, categories, and more
from the command line. Designed for both humans and AI agents.

Authentication:
  Set the YNAB_TOKEN environment variable, or use the --token flag.
  Get your token at: https://app.ynab.com/settings/developer

Output:
  By default, clinab shows colorful, human-friendly tables.
  Use --json for machine-readable JSON output (great for scripting & AI agents).

Budget Selection:
  Use -b/--budget to select a budget by name or ID.
  Defaults to "last-used" if not specified.`
  )
  .option(
    "-t, --token <token>",
    "YNAB API token (default: $YNAB_TOKEN env var)"
  )
  .option(
    "-b, --budget <budget>",
    'Budget name or ID (default: "last-used")',
    "last-used"
  )
  .option("--json", "Output as JSON (for scripting and AI agents)", false)
  .option("--base-url <url>", "Override YNAB API base URL")
  .hook("preAction", async (thisCommand) => {
    const opts = thisCommand.opts();

    // Set JSON mode
    if (opts.json) {
      setJsonMode(true);
    }

    // Initialize API client
    const token = opts.token || process.env.YNAB_TOKEN;
    if (!token) {
      printError(
        "No YNAB API token found. Set YNAB_TOKEN env var or use --token flag.\n" +
          "Get your token at: https://app.ynab.com/settings/developer"
      );
      process.exit(1);
    }
    initClient(token, opts.baseUrl);

    // Resolve budget ID if needed
    if (opts.budget && opts.budget !== "last-used") {
      opts.budget = await resolveBudgetId(opts.budget);
    }
  });

// Register all commands
program.addCommand(budgetsCommand());
program.addCommand(accountsCommand());
program.addCommand(categoriesCommand());
program.addCommand(transactionsCommand());
program.addCommand(payeesCommand());
program.addCommand(monthsCommand());
program.addCommand(scheduledCommand());
program.addCommand(userCommand());

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (err: unknown) {
  if (err instanceof YnabApiError) {
    printError(`API Error (${err.statusCode}): ${err.detail}`);
    process.exit(1);
  }
  if (err instanceof Error) {
    // Commander throws for --help and --version, which is fine
    if (err.message.includes("(outputHelp)") || err.message.includes("(version)")) {
      process.exit(0);
    }
    printError(err.message);
    process.exit(1);
  }
  throw err;
}
