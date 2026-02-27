import { test, expect, describe, beforeAll } from "bun:test";
import { initClient } from "../../src/api/client.ts";
import { getMonths, getMonth } from "../../src/api/months.ts";

const YNAB_TOKEN = process.env.YNAB_TOKEN;
const DEVPLAN_ID = "77d887b7-cc1d-4395-8e67-3c166dc5b04c";

describe("months API", () => {
  beforeAll(() => {
    if (!YNAB_TOKEN) throw new Error("YNAB_TOKEN required");
    initClient(YNAB_TOKEN);
  });

  test("getMonths returns months array", async () => {
    const { months, server_knowledge } = await getMonths(DEVPLAN_ID);
    expect(Array.isArray(months)).toBe(true);
    expect(months.length).toBeGreaterThan(0);
    expect(typeof server_knowledge).toBe("number");
  });

  test("months have required fields", async () => {
    const { months } = await getMonths(DEVPLAN_ID);
    for (const month of months) {
      expect(month.month).toBeTruthy();
      expect(typeof month.income).toBe("number");
      expect(typeof month.budgeted).toBe("number");
      expect(typeof month.activity).toBe("number");
      expect(typeof month.to_be_budgeted).toBe("number");
      expect(typeof month.age_of_money).toBe("number");
    }
  });

  test("getMonth returns specific month detail", async () => {
    const detail = await getMonth(DEVPLAN_ID, "2026-02-01");
    expect(detail.month).toBe("2026-02-01");
    expect(typeof detail.income).toBe("number");
    expect(typeof detail.budgeted).toBe("number");
  });

  test("getMonth with 'current' returns current month", async () => {
    const detail = await getMonth(DEVPLAN_ID, "current");
    expect(detail.month).toBeTruthy();
    expect(typeof detail.income).toBe("number");
  });

  test("month detail includes categories", async () => {
    const detail = await getMonth(DEVPLAN_ID, "current");
    expect(Array.isArray(detail.categories)).toBe(true);
    if (detail.categories.length > 0) {
      const cat = detail.categories[0]!;
      expect(cat.name).toBeTruthy();
      expect(typeof cat.budgeted).toBe("number");
      expect(typeof cat.activity).toBe("number");
      expect(typeof cat.balance).toBe("number");
    }
  });
});
