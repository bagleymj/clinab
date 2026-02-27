import { Command } from "commander";
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importTransactions,
  getTransactionsByAccount,
  getTransactionsByCategory,
  getTransactionsByPayee,
} from "../api/transactions.ts";
import { resolveAccountId } from "../api/accounts.ts";
import { resolveCategoryId } from "../api/categories.ts";
import { resolvePayeeId } from "../api/payees.ts";
import {
  colorAmount,
  printTable,
  printDetail,
  printJson,
  printSuccess,
  isJsonMode,
} from "../formatters/output.ts";
import { formatCurrency, amountToMilliunits } from "../formatters/currency.ts";
import chalk from "chalk";
import type { ClearedStatus, FlagColor } from "../types/ynab.ts";

function getBudgetId(command: Command): string {
  let parent = command.parent;
  while (parent) {
    const opts = parent.opts();
    if (opts.budget) return opts.budget;
    parent = parent.parent;
  }
  return "last-used";
}

function formatCleared(status: string): string {
  switch (status) {
    case "cleared":
      return chalk.green("C");
    case "reconciled":
      return chalk.blue("R");
    default:
      return chalk.yellow("U");
  }
}

const TRANSACTION_COLUMNS = [
  { header: "Date", key: "date" },
  { header: "Payee", key: "payee_name" },
  { header: "Category", key: "category_name" },
  {
    header: "Amount",
    key: "amount",
    align: "right" as const,
    formatter: (v: unknown) => colorAmount(v as number),
  },
  { header: "Account", key: "account_name" },
  {
    header: "Clr",
    key: "cleared",
    formatter: (v: unknown) => formatCleared(v as string),
  },
  { header: "Memo", key: "memo", formatter: (v: unknown) => chalk.dim(String(v ?? "")) },
];

export function transactionsCommand(): Command {
  const cmd = new Command("transactions")
    .alias("txn")
    .description("Manage transactions (create, list, update, delete)")
    .addHelpText(
      "after",
      `
Examples:
  clinab txn list                                     List recent transactions
  clinab txn list --since 2026-01-01                  Transactions since a date
  clinab txn list --account "Checking"                Filter by account
  clinab txn list --category "Groceries"              Filter by category
  clinab txn list --payee "Walmart"                   Filter by payee
  clinab txn list --type unapproved                   Show unapproved transactions
  clinab txn show <id>                                Show transaction details
  clinab txn add -a "Checking" -p "Costco" -c "Groceries" -m "Weekly shop" -- -85.50
  clinab txn update <id> --memo "Updated memo"
  clinab txn delete <id>                              Delete a transaction
  clinab txn import                                   Import linked transactions`
    );

  cmd
    .command("list")
    .description("List transactions with optional filters")
    .option("-s, --since <date>", "Only show transactions since date (YYYY-MM-DD)")
    .option("-t, --type <type>", "Filter: uncategorized or unapproved")
    .option("-a, --account <account>", "Filter by account name or ID")
    .option("-c, --category <category>", "Filter by category name or ID")
    .option("-p, --payee <payee>", "Filter by payee name or ID")
    .option("-l, --limit <n>", "Limit number of results", "50")
    .action(async (opts, command) => {
      const budgetId = getBudgetId(command);
      let transactions;

      if (opts.account) {
        const accountId = await resolveAccountId(budgetId, opts.account);
        const result = await getTransactionsByAccount(budgetId, accountId, {
          since_date: opts.since,
          type: opts.type,
        });
        transactions = result.transactions;
      } else if (opts.category) {
        const categoryId = await resolveCategoryId(budgetId, opts.category);
        const result = await getTransactionsByCategory(budgetId, categoryId, {
          since_date: opts.since,
          type: opts.type,
        });
        transactions = result.transactions;
      } else if (opts.payee) {
        const payeeId = await resolvePayeeId(budgetId, opts.payee);
        const result = await getTransactionsByPayee(budgetId, payeeId, {
          since_date: opts.since,
          type: opts.type,
        });
        transactions = result.transactions;
      } else {
        const result = await getTransactions(budgetId, {
          since_date: opts.since,
          type: opts.type,
        });
        transactions = result.transactions;
      }

      // Filter deleted and apply limit
      transactions = transactions
        .filter((t) => !t.deleted)
        .slice(0, parseInt(opts.limit));

      if (isJsonMode()) {
        printJson(transactions);
        return;
      }

      printTable(
        TRANSACTION_COLUMNS,
        transactions.map((t) => ({
          date: t.date,
          payee_name: t.payee_name ?? "",
          category_name: t.category_name ?? chalk.dim("Uncategorized"),
          amount: t.amount,
          account_name: t.account_name,
          cleared: t.cleared,
          memo: t.memo,
        }))
      );
    });

  cmd
    .command("show <id>")
    .description("Show full details for a transaction")
    .action(async (id: string, _opts, command) => {
      const budgetId = getBudgetId(command);
      const txn = await getTransaction(budgetId, id);

      if (isJsonMode()) {
        printJson(txn);
        return;
      }

      const fields = [
        { label: "ID", value: txn.id },
        { label: "Date", value: txn.date },
        { label: "Amount", value: formatCurrency(txn.amount) },
        { label: "Payee", value: txn.payee_name ?? "" },
        { label: "Category", value: txn.category_name ?? "Uncategorized" },
        { label: "Account", value: txn.account_name },
        { label: "Memo", value: txn.memo ?? "" },
        { label: "Cleared", value: txn.cleared },
        { label: "Approved", value: txn.approved ? "Yes" : "No" },
        { label: "Flag", value: txn.flag_color ?? "None" },
      ];

      if (txn.subtransactions.length > 0) {
        fields.push({
          label: "Split",
          value: `${txn.subtransactions.length} sub-transactions`,
        });
      }

      printDetail(fields);

      if (txn.subtransactions.length > 0) {
        console.log("\n  Sub-transactions:");
        printTable(
          [
            { header: "Category", key: "category_name" },
            { header: "Payee", key: "payee_name" },
            {
              header: "Amount",
              key: "amount",
              align: "right",
              formatter: (v: unknown) => colorAmount(v as number),
            },
            { header: "Memo", key: "memo" },
          ],
          txn.subtransactions.map((s) => ({
            category_name: s.category_name ?? "",
            payee_name: s.payee_name ?? "",
            amount: s.amount,
            memo: s.memo ?? "",
          }))
        );
      }
    });

  cmd
    .command("add <amount>")
    .description("Create a new transaction (negative = outflow, positive = inflow)")
    .requiredOption("-a, --account <account>", "Account name or ID")
    .option("-p, --payee <payee>", "Payee name (creates new payee if needed)")
    .option("-c, --category <category>", "Category name or ID")
    .option("-m, --memo <memo>", "Transaction memo")
    .option("-d, --date <date>", "Transaction date (YYYY-MM-DD, default: today)")
    .option("--cleared <status>", "cleared, uncleared, or reconciled", "cleared")
    .option("--approved", "Approve the transaction", true)
    .option("--flag <color>", "Flag color: red, orange, yellow, green, blue, purple")
    .action(async (amount: string, opts, command) => {
      const budgetId = getBudgetId(command);
      const accountId = await resolveAccountId(budgetId, opts.account);
      const milliunits = amountToMilliunits(parseFloat(amount));
      const date = opts.date ?? new Date().toISOString().split("T")[0];

      let categoryId: string | undefined;
      if (opts.category) {
        categoryId = await resolveCategoryId(budgetId, opts.category);
      }

      const result = await createTransaction(budgetId, {
        account_id: accountId,
        date,
        amount: milliunits,
        payee_name: opts.payee,
        category_id: categoryId,
        memo: opts.memo,
        cleared: opts.cleared as ClearedStatus,
        approved: opts.approved,
        flag_color: (opts.flag as FlagColor) ?? null,
      });

      if (isJsonMode()) {
        printJson(result);
        return;
      }
      printSuccess(
        `Created transaction: ${formatCurrency(milliunits)} at "${opts.payee ?? "unknown"}" on ${date}`
      );
    });

  cmd
    .command("update <id>")
    .description("Update an existing transaction")
    .option("-a, --account <account>", "Account name or ID")
    .option("-p, --payee <payee>", "Payee name")
    .option("-c, --category <category>", "Category name or ID")
    .option("-m, --memo <memo>", "Transaction memo")
    .option("-d, --date <date>", "Transaction date (YYYY-MM-DD)")
    .option("--amount <amount>", "New amount in dollars")
    .option("--cleared <status>", "cleared, uncleared, or reconciled")
    .option("--flag <color>", "Flag color: red, orange, yellow, green, blue, purple")
    .action(async (id: string, opts, command) => {
      const budgetId = getBudgetId(command);

      // Get existing transaction first
      const existing = await getTransaction(budgetId, id);
      const updates: Record<string, unknown> = {
        account_id: existing.account_id,
        date: existing.date,
        amount: existing.amount,
      };

      if (opts.account) {
        updates.account_id = await resolveAccountId(budgetId, opts.account);
      }
      if (opts.payee) updates.payee_name = opts.payee;
      if (opts.category) {
        updates.category_id = await resolveCategoryId(budgetId, opts.category);
      }
      if (opts.memo !== undefined) updates.memo = opts.memo;
      if (opts.date) updates.date = opts.date;
      if (opts.amount) updates.amount = amountToMilliunits(parseFloat(opts.amount));
      if (opts.cleared) updates.cleared = opts.cleared;
      if (opts.flag) updates.flag_color = opts.flag;

      const txn = await updateTransaction(budgetId, id, updates as any);

      if (isJsonMode()) {
        printJson(txn);
        return;
      }
      printSuccess(`Updated transaction ${txn.id}`);
    });

  cmd
    .command("delete <id>")
    .description("Delete a transaction")
    .action(async (id: string, _opts, command) => {
      const budgetId = getBudgetId(command);
      const txn = await deleteTransaction(budgetId, id);

      if (isJsonMode()) {
        printJson(txn);
        return;
      }
      printSuccess(`Deleted transaction ${txn.id}`);
    });

  cmd
    .command("import")
    .description("Import transactions from linked accounts (direct import)")
    .action(async (_opts, command) => {
      const budgetId = getBudgetId(command);
      const result = await importTransactions(budgetId);

      if (isJsonMode()) {
        printJson(result);
        return;
      }
      printSuccess(`Imported ${result.transaction_ids.length} transaction(s)`);
    });

  return cmd;
}
