import { Command } from "commander";
import { getMonths, getMonth } from "../api/months.ts";
import {
  colorAmount,
  printTable,
  printDetail,
  printJson,
  isJsonMode,
} from "../formatters/output.ts";
import { formatCurrency } from "../formatters/currency.ts";
import chalk from "chalk";

function getBudgetId(command: Command): string {
  let parent = command.parent;
  while (parent) {
    const opts = parent.opts();
    if (opts.budget) return opts.budget;
    parent = parent.parent;
  }
  return "last-used";
}

export function monthsCommand(): Command {
  const cmd = new Command("months")
    .description("View budget month summaries and details")
    .addHelpText(
      "after",
      `
Examples:
  clinab months list                     List all budget months
  clinab months show current             Show current month details
  clinab months show 2026-02-01          Show a specific month`
    );

  cmd
    .command("list")
    .description("List all budget months with summary data")
    .action(async (_opts, command) => {
      const budgetId = getBudgetId(command);
      const { months } = await getMonths(budgetId);
      const filtered = months.filter((m) => !m.deleted);

      if (isJsonMode()) {
        printJson(filtered);
        return;
      }

      printTable(
        [
          { header: "Month", key: "month" },
          {
            header: "Income",
            key: "income",
            align: "right",
            formatter: (v) => colorAmount(v as number),
          },
          {
            header: "Budgeted",
            key: "budgeted",
            align: "right",
            formatter: (v) => colorAmount(v as number),
          },
          {
            header: "Activity",
            key: "activity",
            align: "right",
            formatter: (v) => colorAmount(v as number),
          },
          {
            header: "To Be Budgeted",
            key: "to_be_budgeted",
            align: "right",
            formatter: (v) => colorAmount(v as number),
          },
          {
            header: "Age of Money",
            key: "age_of_money",
            align: "right",
            formatter: (v) => (v as number > 0 ? `${v} days` : "—"),
          },
        ],
        filtered.map((m) => ({
          month: m.month,
          income: m.income,
          budgeted: m.budgeted,
          activity: m.activity,
          to_be_budgeted: m.to_be_budgeted,
          age_of_money: m.age_of_money,
        }))
      );
    });

  cmd
    .command("show <month>")
    .description('Show details for a specific month (YYYY-MM-DD or "current")')
    .action(async (month: string, _opts, command) => {
      const budgetId = getBudgetId(command);
      const detail = await getMonth(budgetId, month);

      if (isJsonMode()) {
        printJson(detail);
        return;
      }

      printDetail([
        { label: "Month", value: detail.month },
        { label: "Income", value: formatCurrency(detail.income) },
        { label: "Budgeted", value: formatCurrency(detail.budgeted) },
        { label: "Activity", value: formatCurrency(detail.activity) },
        {
          label: "To Be Budgeted",
          value: formatCurrency(detail.to_be_budgeted),
        },
        {
          label: "Age of Money",
          value: detail.age_of_money > 0 ? `${detail.age_of_money} days` : "—",
        },
        { label: "Note", value: detail.note ?? "" },
      ]);

      if (detail.categories && detail.categories.length > 0) {
        console.log("\n  Category Breakdown:");
        const cats = detail.categories.filter(
          (c) => !c.deleted && !c.hidden && c.name !== "Inflow: Ready to Assign" && c.name !== "Uncategorized"
        );

        // Group by category_group_name and sort groups
        const grouped = new Map<string, typeof cats>();
        for (const cat of cats) {
          const group = cat.category_group_name ?? "Other";
          if (!grouped.has(group)) grouped.set(group, []);
          grouped.get(group)!.push(cat);
        }

        const rows: Record<string, unknown>[] = [];
        for (const [group, groupCats] of grouped) {
          for (const c of groupCats) {
            rows.push({
              group,
              name: c.name,
              budgeted: c.budgeted,
              activity: c.activity,
              balance: c.balance,
            });
          }
        }

        printTable(
          [
            { header: "Group", key: "group", formatter: (v) => chalk.dim(String(v)) },
            { header: "Category", key: "name" },
            {
              header: "Budgeted",
              key: "budgeted",
              align: "right",
              formatter: (v) => colorAmount(v as number),
            },
            {
              header: "Activity",
              key: "activity",
              align: "right",
              formatter: (v) => colorAmount(v as number),
            },
            {
              header: "Balance",
              key: "balance",
              align: "right",
              formatter: (v) => colorAmount(v as number),
            },
          ],
          rows
        );
      }
    });

  return cmd;
}
