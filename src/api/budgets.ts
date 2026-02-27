import { getClient } from "./client.ts";
import type { BudgetSummary, BudgetSettings } from "../types/ynab.ts";

export async function getBudgets(includeAccounts = false): Promise<BudgetSummary[]> {
  const params = includeAccounts ? { include_accounts: "true" } : undefined;
  const data = await getClient().get<{ budgets: BudgetSummary[] }>("/budgets", params);
  return data.budgets;
}

export async function getBudget(budgetId: string): Promise<BudgetSummary> {
  const data = await getClient().get<{ budget: BudgetSummary }>(`/budgets/${budgetId}`);
  return data.budget;
}

export async function getBudgetSettings(budgetId: string): Promise<BudgetSettings> {
  const data = await getClient().get<{ settings: BudgetSettings }>(`/budgets/${budgetId}/settings`);
  return data.settings;
}

export async function resolveBudgetId(nameOrId: string): Promise<string> {
  if (nameOrId === "last-used" || nameOrId === "default") {
    return nameOrId;
  }
  // Check if it looks like a UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)) {
    return nameOrId;
  }
  // Otherwise, search by name
  const budgets = await getBudgets();
  const match = budgets.find(
    (b) => b.name.toLowerCase() === nameOrId.toLowerCase()
  );
  if (!match) {
    const names = budgets.map((b) => b.name).join(", ");
    throw new Error(
      `Budget "${nameOrId}" not found. Available budgets: ${names}`
    );
  }
  return match.id;
}
