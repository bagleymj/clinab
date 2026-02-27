import { Command } from "commander";
import {
  getCategories,
  getCategory,
  updateMonthCategory,
  createCategory,
  createCategoryGroup,
  updateCategory,
  updateCategoryGroup,
  resolveCategoryId,
} from "../api/categories.ts";
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

function getBudgetId(command: Command): string {
  let parent = command.parent;
  while (parent) {
    const opts = parent.opts();
    if (opts.budget) return opts.budget;
    parent = parent.parent;
  }
  return "last-used";
}

export function categoriesCommand(): Command {
  const cmd = new Command("categories")
    .alias("cat")
    .description("Manage budget categories and category groups")
    .addHelpText(
      "after",
      `
Examples:
  clinab categories list                       List all category groups and categories
  clinab categories show "Groceries"           Show details for a category
  clinab categories budget "Groceries" 500     Set $500 budget for Groceries this month
  clinab categories budget "Rent" 1200 --month 2026-03-01
  clinab categories create "Pet Food" --group "Frequent"
  clinab categories create-group "Pets"        Create a new category group`
    );

  cmd
    .command("list")
    .description("List all category groups and their categories")
    .option("--include-hidden", "Include hidden categories", false)
    .action(async (opts, command) => {
      const budgetId = getBudgetId(command);
      const { category_groups } = await getCategories(budgetId);

      if (isJsonMode()) {
        printJson(category_groups);
        return;
      }

      const rows: Record<string, unknown>[] = [];
      for (const group of category_groups) {
        if (group.hidden && !opts.includeHidden) continue;
        if (group.deleted) continue;
        // Skip internal categories for display
        if (group.name === "Internal Master Category") continue;
        if (group.name === "Hidden Categories" && !opts.includeHidden) continue;

        for (const cat of group.categories) {
          if (cat.hidden && !opts.includeHidden) continue;
          if (cat.deleted) continue;
          rows.push({
            group: group.name,
            name: cat.name,
            budgeted: cat.budgeted,
            activity: cat.activity,
            balance: cat.balance,
            goal: cat.goal_type ?? "—",
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
          { header: "Goal", key: "goal" },
        ],
        rows
      );
    });

  cmd
    .command("show <category>")
    .description("Show details for a specific category (by name or ID)")
    .action(async (category: string, _opts, command) => {
      const budgetId = getBudgetId(command);
      const categoryId = await resolveCategoryId(budgetId, category);
      const cat = await getCategory(budgetId, categoryId);

      if (isJsonMode()) {
        printJson(cat);
        return;
      }

      printDetail([
        { label: "Name", value: cat.name },
        { label: "ID", value: cat.id },
        { label: "Group", value: cat.category_group_name },
        { label: "Budgeted", value: formatCurrency(cat.budgeted) },
        { label: "Activity", value: formatCurrency(cat.activity) },
        { label: "Balance", value: formatCurrency(cat.balance) },
        { label: "Goal Type", value: cat.goal_type ?? "None" },
        { label: "Goal Target", value: cat.goal_target ? formatCurrency(cat.goal_target) : "—" },
        { label: "Hidden", value: cat.hidden ? "Yes" : "No" },
        { label: "Note", value: cat.note ?? "" },
      ]);
    });

  cmd
    .command("budget <category> <amount>")
    .description("Set the budgeted amount for a category in a given month")
    .option("-m, --month <month>", "Month (YYYY-MM-DD format, default: current)", "current")
    .action(async (category: string, amount: string, opts, command) => {
      const budgetId = getBudgetId(command);
      const categoryId = await resolveCategoryId(budgetId, category);
      const milliunits = amountToMilliunits(parseFloat(amount));
      const updated = await updateMonthCategory(budgetId, opts.month, categoryId, {
        budgeted: milliunits,
      });

      if (isJsonMode()) {
        printJson(updated);
        return;
      }
      printSuccess(
        `Set "${updated.name}" budget to ${formatCurrency(updated.budgeted)} for ${opts.month}`
      );
    });

  cmd
    .command("create <name>")
    .description("Create a new category")
    .requiredOption("-g, --group <group>", "Category group name or ID")
    .option("-n, --note <note>", "Category note")
    .action(async (name: string, opts, command) => {
      const budgetId = getBudgetId(command);
      // Resolve group
      const { category_groups } = await getCategories(budgetId);
      let groupId = opts.group;
      if (!/^[0-9a-f]{8}-/.test(groupId)) {
        const match = category_groups.find(
          (g) => g.name.toLowerCase() === groupId.toLowerCase()
        );
        if (!match) {
          const names = category_groups.map((g) => g.name).join(", ");
          throw new Error(`Group "${opts.group}" not found. Available: ${names}`);
        }
        groupId = match.id;
      }

      const cat = await createCategory(budgetId, {
        name,
        category_group_id: groupId,
        note: opts.note,
      });

      if (isJsonMode()) {
        printJson(cat);
        return;
      }
      printSuccess(`Created category "${cat.name}" in group "${cat.category_group_name}"`);
    });

  cmd
    .command("update <category>")
    .description("Update a category name or note")
    .option("-n, --name <name>", "New name")
    .option("--note <note>", "New note")
    .action(async (category: string, opts, command) => {
      const budgetId = getBudgetId(command);
      const categoryId = await resolveCategoryId(budgetId, category);
      const updates: Record<string, string | null> = {};
      if (opts.name) updates.name = opts.name;
      if (opts.note !== undefined) updates.note = opts.note;

      const cat = await updateCategory(budgetId, categoryId, updates);

      if (isJsonMode()) {
        printJson(cat);
        return;
      }
      printSuccess(`Updated category "${cat.name}"`);
    });

  cmd
    .command("create-group <name>")
    .description("Create a new category group")
    .action(async (name: string, _opts, command) => {
      const budgetId = getBudgetId(command);
      const group = await createCategoryGroup(budgetId, { name });

      if (isJsonMode()) {
        printJson(group);
        return;
      }
      printSuccess(`Created category group "${group.name}"`);
    });

  cmd
    .command("update-group <group>")
    .description("Rename a category group")
    .requiredOption("-n, --name <name>", "New group name")
    .action(async (group: string, opts, command) => {
      const budgetId = getBudgetId(command);
      // Resolve group ID
      const { category_groups } = await getCategories(budgetId);
      let groupId = group;
      if (!/^[0-9a-f]{8}-/.test(groupId)) {
        const match = category_groups.find(
          (g) => g.name.toLowerCase() === groupId.toLowerCase()
        );
        if (!match) throw new Error(`Group "${group}" not found.`);
        groupId = match.id;
      }

      const updated = await updateCategoryGroup(budgetId, groupId, { name: opts.name });

      if (isJsonMode()) {
        printJson(updated);
        return;
      }
      printSuccess(`Renamed category group to "${updated.name}"`);
    });

  return cmd;
}
