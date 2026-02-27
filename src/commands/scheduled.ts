import { Command } from "commander";
import {
  getScheduledTransactions,
  getScheduledTransaction,
  createScheduledTransaction,
  deleteScheduledTransaction,
} from "../api/scheduled.ts";
import { resolveAccountId } from "../api/accounts.ts";
import { resolveCategoryId } from "../api/categories.ts";
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
import type { Frequency, FlagColor } from "../types/ynab.ts";

function getBudgetId(command: Command): string {
  let parent = command.parent;
  while (parent) {
    const opts = parent.opts();
    if (opts.budget) return opts.budget;
    parent = parent.parent;
  }
  return "last-used";
}

const FREQUENCIES: Frequency[] = [
  "never",
  "daily",
  "weekly",
  "everyOtherWeek",
  "twiceAMonth",
  "every4Weeks",
  "monthly",
  "everyOtherMonth",
  "every3Months",
  "every4Months",
  "twiceAYear",
  "yearly",
  "everyOtherYear",
];

export function scheduledCommand(): Command {
  const cmd = new Command("scheduled")
    .alias("sched")
    .description("Manage scheduled/recurring transactions")
    .addHelpText(
      "after",
      `
Examples:
  clinab scheduled list                          List all scheduled transactions
  clinab scheduled show <id>                     Show scheduled transaction details
  clinab sched add -a "Checking" -p "Landlord" -f monthly -- -1200
  clinab scheduled delete <id>                   Delete a scheduled transaction

Frequencies: ${FREQUENCIES.join(", ")}`
    );

  cmd
    .command("list")
    .description("List all scheduled transactions")
    .action(async (_opts, command) => {
      const budgetId = getBudgetId(command);
      const { scheduled_transactions } = await getScheduledTransactions(budgetId);
      const filtered = scheduled_transactions.filter((t) => !t.deleted);

      if (isJsonMode()) {
        printJson(filtered);
        return;
      }

      printTable(
        [
          { header: "Next Date", key: "date_next" },
          { header: "Frequency", key: "frequency" },
          { header: "Payee", key: "payee_name" },
          { header: "Category", key: "category_name" },
          {
            header: "Amount",
            key: "amount",
            align: "right",
            formatter: (v) => colorAmount(v as number),
          },
          { header: "Account", key: "account_name" },
          { header: "Memo", key: "memo", formatter: (v) => chalk.dim(String(v ?? "")) },
        ],
        filtered.map((t) => ({
          date_next: t.date_next,
          frequency: t.frequency,
          payee_name: t.payee_name ?? "",
          category_name: t.category_name ?? "",
          amount: t.amount,
          account_name: t.account_name,
          memo: t.memo,
        }))
      );
    });

  cmd
    .command("show <id>")
    .description("Show details for a scheduled transaction")
    .action(async (id: string, _opts, command) => {
      const budgetId = getBudgetId(command);
      const txn = await getScheduledTransaction(budgetId, id);

      if (isJsonMode()) {
        printJson(txn);
        return;
      }

      printDetail([
        { label: "ID", value: txn.id },
        { label: "First Date", value: txn.date_first },
        { label: "Next Date", value: txn.date_next },
        { label: "Frequency", value: txn.frequency },
        { label: "Amount", value: formatCurrency(txn.amount) },
        { label: "Payee", value: txn.payee_name ?? "" },
        { label: "Category", value: txn.category_name ?? "" },
        { label: "Account", value: txn.account_name },
        { label: "Memo", value: txn.memo ?? "" },
        { label: "Flag", value: txn.flag_color ?? "None" },
      ]);

      if (txn.subtransactions.length > 0) {
        console.log("\n  Sub-transactions:");
        printTable(
          [
            { header: "Category", key: "category_id" },
            {
              header: "Amount",
              key: "amount",
              align: "right",
              formatter: (v: unknown) => colorAmount(v as number),
            },
            { header: "Memo", key: "memo" },
          ],
          txn.subtransactions.map((s) => ({
            category_id: s.category_id ?? "",
            amount: s.amount,
            memo: s.memo ?? "",
          }))
        );
      }
    });

  cmd
    .command("add <amount>")
    .description("Create a scheduled transaction (negative = outflow)")
    .requiredOption("-a, --account <account>", "Account name or ID")
    .requiredOption("-f, --frequency <freq>", `Frequency: ${FREQUENCIES.join(", ")}`)
    .option("-p, --payee <payee>", "Payee name")
    .option("-c, --category <category>", "Category name or ID")
    .option("-m, --memo <memo>", "Memo")
    .option("-d, --date <date>", "First date (YYYY-MM-DD, default: today)")
    .option("--flag <color>", "Flag color")
    .action(async (amount: string, opts, command) => {
      if (!FREQUENCIES.includes(opts.frequency as Frequency)) {
        throw new Error(
          `Invalid frequency "${opts.frequency}". Valid: ${FREQUENCIES.join(", ")}`
        );
      }
      const budgetId = getBudgetId(command);
      const accountId = await resolveAccountId(budgetId, opts.account);
      const milliunits = amountToMilliunits(parseFloat(amount));
      const date = opts.date ?? new Date().toISOString().split("T")[0];

      let categoryId: string | undefined;
      if (opts.category) {
        categoryId = await resolveCategoryId(budgetId, opts.category);
      }

      const txn = await createScheduledTransaction(budgetId, {
        account_id: accountId,
        date,
        amount: milliunits,
        frequency: opts.frequency as Frequency,
        payee_name: opts.payee,
        category_id: categoryId,
        memo: opts.memo,
        flag_color: (opts.flag as FlagColor) ?? null,
      });

      if (isJsonMode()) {
        printJson(txn);
        return;
      }
      printSuccess(
        `Created scheduled transaction: ${formatCurrency(milliunits)} (${opts.frequency})`
      );
    });

  cmd
    .command("delete <id>")
    .description("Delete a scheduled transaction")
    .action(async (id: string, _opts, command) => {
      const budgetId = getBudgetId(command);
      const txn = await deleteScheduledTransaction(budgetId, id);

      if (isJsonMode()) {
        printJson(txn);
        return;
      }
      printSuccess(`Deleted scheduled transaction ${txn.id}`);
    });

  return cmd;
}
