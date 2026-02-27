import { Command } from "commander";
import { getBudgets, getBudgetSettings } from "../api/budgets.ts";
import { printTable, printDetail, printJson, isJsonMode } from "../formatters/output.ts";

export function budgetsCommand(): Command {
  const cmd = new Command("budgets")
    .description("List and inspect budgets")
    .addHelpText(
      "after",
      `
Examples:
  clinab budgets list                    List all budgets
  clinab budgets list --json             List budgets as JSON (for scripting)
  clinab budgets settings                Show settings for the active budget
  clinab budgets settings -b "DevPlan"   Show settings for a specific budget`
    );

  cmd
    .command("list")
    .description("List all budgets accessible with your token")
    .action(async () => {
      const budgets = await getBudgets();
      if (isJsonMode()) {
        printJson(budgets);
        return;
      }
      printTable(
        [
          { header: "Name", key: "name" },
          { header: "ID", key: "id" },
          { header: "Last Modified", key: "last_modified_on" },
          { header: "First Month", key: "first_month" },
          { header: "Last Month", key: "last_month" },
        ],
        budgets.map((b) => ({
          name: b.name,
          id: b.id,
          last_modified_on: b.last_modified_on.split("T")[0],
          first_month: b.first_month,
          last_month: b.last_month,
        }))
      );
    });

  cmd
    .command("settings")
    .description("Show budget settings (date format, currency format)")
    .action(async (_opts, command) => {
      const budgetId = command.parent!.parent!.opts().budget;
      const settings = await getBudgetSettings(budgetId);
      if (isJsonMode()) {
        printJson(settings);
        return;
      }
      printDetail([
        { label: "Date Format", value: settings.date_format.format },
        { label: "Currency", value: settings.currency_format.iso_code },
        {
          label: "Currency Symbol",
          value: settings.currency_format.currency_symbol,
        },
        {
          label: "Example",
          value: settings.currency_format.example_format,
        },
      ]);
    });

  return cmd;
}
