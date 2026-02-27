import { Command } from "commander";
import { getAccounts, getAccount, createAccount } from "../api/accounts.ts";
import type { AccountType } from "../types/ynab.ts";
import { colorAmount, printTable, printDetail, printJson, printSuccess, isJsonMode } from "../formatters/output.ts";
import { formatCurrency } from "../formatters/currency.ts";
import { amountToMilliunits } from "../formatters/currency.ts";
import chalk from "chalk";

const ACCOUNT_TYPES: AccountType[] = [
  "checking",
  "savings",
  "cash",
  "creditCard",
  "lineOfCredit",
  "otherAsset",
  "otherLiability",
  "mortgage",
  "autoLoan",
  "studentLoan",
  "personalLoan",
  "medicalDebt",
  "otherDebt",
];

const ASSET_TYPES = new Set<string>([
  "checking", "savings", "cash", "otherAsset",
]);

function getBudgetId(command: Command): string {
  let parent = command.parent;
  while (parent) {
    const opts = parent.opts();
    if (opts.budget) return opts.budget;
    parent = parent.parent;
  }
  return "last-used";
}

export function accountsCommand(): Command {
  const cmd = new Command("accounts")
    .description("Manage budget accounts (checking, savings, credit cards, etc.)")
    .addHelpText(
      "after",
      `
Examples:
  clinab accounts list                             List all accounts
  clinab accounts list --include-closed            Include closed accounts
  clinab accounts show <name-or-id>                Show account details
  clinab accounts create "My Checking" checking 0  Create a new checking account
  clinab accounts create "Visa" creditCard 0       Create a credit card account`
    );

  cmd
    .command("list")
    .description("List all accounts in the budget")
    .option("--include-closed", "Include closed accounts", false)
    .action(async (opts, command) => {
      const budgetId = getBudgetId(command);
      const { accounts } = await getAccounts(budgetId);
      const filtered = opts.includeClosed
        ? accounts.filter((a) => !a.deleted)
        : accounts.filter((a) => !a.closed && !a.deleted);

      if (isJsonMode()) {
        printJson(filtered);
        return;
      }

      // Detect duplicate names so we can show short IDs
      const nameCounts = new Map<string, number>();
      for (const a of filtered) {
        nameCounts.set(a.name, (nameCounts.get(a.name) ?? 0) + 1);
      }

      printTable(
        [
          {
            header: "Name",
            key: "name",
            formatter: (v, row) => {
              const name = String(v);
              const shortId = String(row.id ?? "").slice(0, 8);
              return (nameCounts.get(name) ?? 0) > 1
                ? `${name} ${chalk.dim(`(${shortId})`)}`
                : name;
            },
          },
          { header: "Type", key: "type" },
          { header: "Balance", key: "balance", align: "right", formatter: (v) => colorAmount(v as number) },
          { header: "Cleared", key: "cleared_balance", align: "right", formatter: (v) => colorAmount(v as number) },
          { header: "Uncleared", key: "uncleared_balance", align: "right", formatter: (v) => colorAmount(v as number) },
          { header: "On Budget", key: "on_budget", formatter: (v) => (v ? "✓" : "—") },
        ],
        filtered.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: a.balance,
          cleared_balance: a.cleared_balance,
          uncleared_balance: a.uncleared_balance,
          on_budget: a.on_budget,
        }))
      );

      // Print account summary
      if (filtered.length > 0) {
        const assets = filtered
          .filter((a) => ASSET_TYPES.has(a.type))
          .reduce((sum, a) => sum + a.balance, 0);
        const liabilities = filtered
          .filter((a) => !ASSET_TYPES.has(a.type))
          .reduce((sum, a) => sum + a.balance, 0);
        const net = assets + liabilities;

        console.log(
          `\n  ${chalk.dim(`${filtered.length} accounts`)}  ` +
            `Assets: ${chalk.green(formatCurrency(assets))}  ` +
            `Liabilities: ${chalk.red(formatCurrency(liabilities))}  ` +
            `Net: ${colorAmount(net)}`
        );
      }
    });

  cmd
    .command("show <account>")
    .description("Show details for a specific account (by name or ID)")
    .action(async (account: string, _opts, command) => {
      const budgetId = getBudgetId(command);
      // Resolve by name if needed
      const { resolveAccountId } = await import("../api/accounts.ts");
      const accountId = await resolveAccountId(budgetId, account);
      const acc = await getAccount(budgetId, accountId);

      if (isJsonMode()) {
        printJson(acc);
        return;
      }

      printDetail([
        { label: "Name", value: acc.name },
        { label: "ID", value: acc.id },
        { label: "Type", value: acc.type },
        { label: "On Budget", value: acc.on_budget ? "Yes" : "No" },
        { label: "Closed", value: acc.closed ? "Yes" : "No" },
        { label: "Balance", value: formatCurrency(acc.balance) },
        { label: "Cleared", value: formatCurrency(acc.cleared_balance) },
        { label: "Uncleared", value: formatCurrency(acc.uncleared_balance) },
        { label: "Note", value: acc.note ?? "" },
        {
          label: "Last Reconciled",
          value: acc.last_reconciled_at ?? "Never",
        },
      ]);
    });

  cmd
    .command("create <name> <type> <balance>")
    .description("Create a new account")
    .addHelpText(
      "after",
      `
Account types: ${ACCOUNT_TYPES.join(", ")}

Balance is in dollars (e.g., 1000.00 or -500.50).`
    )
    .action(async (name: string, type: string, balance: string, _opts, command) => {
      if (!ACCOUNT_TYPES.includes(type as AccountType)) {
        throw new Error(
          `Invalid account type "${type}". Valid types: ${ACCOUNT_TYPES.join(", ")}`
        );
      }
      const budgetId = getBudgetId(command);
      const balanceMilliunits = amountToMilliunits(parseFloat(balance));
      const acc = await createAccount(budgetId, {
        name,
        type: type as AccountType,
        balance: balanceMilliunits,
      });

      if (isJsonMode()) {
        printJson(acc);
        return;
      }
      printSuccess(`Created account "${acc.name}" (${acc.type}) with balance ${formatCurrency(acc.balance)}`);
    });

  return cmd;
}
