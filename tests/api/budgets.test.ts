import { test, expect, describe, beforeAll } from "bun:test";
import { initClient } from "../../src/api/client.ts";
import { getBudgets, resolveBudgetId, getBudgetSettings } from "../../src/api/budgets.ts";

const YNAB_TOKEN = process.env.YNAB_TOKEN;
const DEVPLAN_ID = "77d887b7-cc1d-4395-8e67-3c166dc5b04c";

describe("budgets API", () => {
  beforeAll(() => {
    if (!YNAB_TOKEN) throw new Error("YNAB_TOKEN required for budget tests");
    initClient(YNAB_TOKEN);
  });

  test("getBudgets returns an array of budgets", async () => {
    const budgets = await getBudgets();
    expect(Array.isArray(budgets)).toBe(true);
    expect(budgets.length).toBeGreaterThan(0);
  });

  test("getBudgets includes DevPlan", async () => {
    const budgets = await getBudgets();
    const devPlan = budgets.find((b) => b.name === "DevPlan");
    expect(devPlan).toBeDefined();
    expect(devPlan!.id).toBe(DEVPLAN_ID);
  });

  test("each budget has required fields", async () => {
    const budgets = await getBudgets();
    for (const budget of budgets) {
      expect(budget.id).toBeTruthy();
      expect(budget.name).toBeTruthy();
      expect(budget.last_modified_on).toBeTruthy();
      expect(budget.date_format).toBeDefined();
      expect(budget.currency_format).toBeDefined();
    }
  });

  test("resolveBudgetId resolves by name", async () => {
    const id = await resolveBudgetId("DevPlan");
    expect(id).toBe(DEVPLAN_ID);
  });

  test("resolveBudgetId is case-insensitive", async () => {
    const id = await resolveBudgetId("devplan");
    expect(id).toBe(DEVPLAN_ID);
  });

  test("resolveBudgetId passes through UUIDs", async () => {
    const id = await resolveBudgetId(DEVPLAN_ID);
    expect(id).toBe(DEVPLAN_ID);
  });

  test("resolveBudgetId passes through special values", async () => {
    expect(await resolveBudgetId("last-used")).toBe("last-used");
    expect(await resolveBudgetId("default")).toBe("default");
  });

  test("resolveBudgetId throws for unknown budget", async () => {
    expect(resolveBudgetId("nonexistent-budget-xyz")).rejects.toThrow(
      /not found/i
    );
  });

  test("getBudgetSettings returns date and currency format", async () => {
    const settings = await getBudgetSettings(DEVPLAN_ID);
    expect(settings.date_format).toBeDefined();
    expect(settings.date_format.format).toBeTruthy();
    expect(settings.currency_format).toBeDefined();
    expect(settings.currency_format.iso_code).toBe("USD");
    expect(settings.currency_format.currency_symbol).toBe("$");
  });
});
