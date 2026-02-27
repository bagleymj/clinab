import { test, expect, describe, beforeAll } from "bun:test";
import { initClient } from "../../src/api/client.ts";
import {
  getCategories,
  getCategory,
  resolveCategoryId,
  updateMonthCategory,
  createCategoryGroup,
  createCategory,
  updateCategory,
  updateCategoryGroup,
} from "../../src/api/categories.ts";

const YNAB_TOKEN = process.env.YNAB_TOKEN;
const DEVPLAN_ID = "77d887b7-cc1d-4395-8e67-3c166dc5b04c";

describe("categories API", () => {
  let testGroupId: string;
  let testCategoryId: string;

  beforeAll(() => {
    if (!YNAB_TOKEN) throw new Error("YNAB_TOKEN required");
    initClient(YNAB_TOKEN);
  });

  test("getCategories returns category groups", async () => {
    const { category_groups, server_knowledge } = await getCategories(DEVPLAN_ID);
    expect(Array.isArray(category_groups)).toBe(true);
    expect(category_groups.length).toBeGreaterThan(0);
    expect(typeof server_knowledge).toBe("number");
  });

  test("category groups contain categories", async () => {
    const { category_groups } = await getCategories(DEVPLAN_ID);
    const bills = category_groups.find((g) => g.name === "Bills");
    expect(bills).toBeDefined();
    expect(bills!.categories.length).toBeGreaterThan(0);
    expect(bills!.categories[0]!.name).toBeTruthy();
  });

  test("categories have budget and activity fields", async () => {
    const { category_groups } = await getCategories(DEVPLAN_ID);
    for (const group of category_groups) {
      for (const cat of group.categories) {
        expect(typeof cat.budgeted).toBe("number");
        expect(typeof cat.activity).toBe("number");
        expect(typeof cat.balance).toBe("number");
      }
    }
  });

  test("resolveCategoryId resolves by name", async () => {
    const id = await resolveCategoryId(DEVPLAN_ID, "Groceries");
    expect(id).toBeTruthy();
    expect(
      /^[0-9a-f]{8}-/.test(id)
    ).toBe(true);
  });

  test("resolveCategoryId is case-insensitive", async () => {
    const id = await resolveCategoryId(DEVPLAN_ID, "groceries");
    expect(id).toBeTruthy();
  });

  test("resolveCategoryId throws for unknown category", async () => {
    expect(
      resolveCategoryId(DEVPLAN_ID, "nonexistent-category-xyz")
    ).rejects.toThrow(/not found/i);
  });

  test("getCategory returns a specific category", async () => {
    const id = await resolveCategoryId(DEVPLAN_ID, "Groceries");
    const cat = await getCategory(DEVPLAN_ID, id);
    expect(cat.name).toBe("Groceries");
    expect(cat.category_group_name).toBe("Frequent");
  });

  test("updateMonthCategory sets budgeted amount", async () => {
    const id = await resolveCategoryId(DEVPLAN_ID, "Groceries");
    const updated = await updateMonthCategory(DEVPLAN_ID, "current", id, {
      budgeted: 500000, // $500
    });
    expect(updated.budgeted).toBe(500000);
  });

  test("createCategoryGroup creates a new group", async () => {
    const group = await createCategoryGroup(DEVPLAN_ID, {
      name: "Test Group",
    });
    expect(group).toBeDefined();
    expect(group.name).toBe("Test Group");
    expect(group.id).toBeTruthy();
    testGroupId = group.id;
  });

  test("createCategory creates category in group", async () => {
    const cat = await createCategory(DEVPLAN_ID, {
      name: "Test Category",
      category_group_id: testGroupId,
    });
    expect(cat).toBeDefined();
    expect(cat.name).toBe("Test Category");
    testCategoryId = cat.id;
  });

  test("updateCategory renames a category", async () => {
    const updated = await updateCategory(DEVPLAN_ID, testCategoryId, {
      name: "Updated Test Category",
    });
    expect(updated.name).toBe("Updated Test Category");
  });

  test("updateCategoryGroup renames a group", async () => {
    const updated = await updateCategoryGroup(DEVPLAN_ID, testGroupId, {
      name: "Updated Test Group",
    });
    expect(updated.name).toBe("Updated Test Group");
  });
});
