import { getClient } from "./client.ts";
import type {
  Category,
  CategoryGroup,
  SaveCategory,
  SaveCategoryGroup,
  SaveMonthCategory,
} from "../types/ynab.ts";

export async function getCategories(
  budgetId: string,
  serverKnowledge?: number
): Promise<{ category_groups: CategoryGroup[]; server_knowledge: number }> {
  const params: Record<string, string | number | undefined> = {};
  if (serverKnowledge !== undefined) {
    params.last_knowledge_of_server = serverKnowledge;
  }
  return getClient().get(`/budgets/${budgetId}/categories`, params);
}

export async function getCategory(
  budgetId: string,
  categoryId: string
): Promise<Category> {
  const data = await getClient().get<{ category: Category }>(
    `/budgets/${budgetId}/categories/${categoryId}`
  );
  return data.category;
}

export async function getCategoryByMonth(
  budgetId: string,
  month: string,
  categoryId: string
): Promise<Category> {
  const data = await getClient().get<{ category: Category }>(
    `/budgets/${budgetId}/months/${month}/categories/${categoryId}`
  );
  return data.category;
}

export async function updateCategory(
  budgetId: string,
  categoryId: string,
  category: SaveCategory
): Promise<Category> {
  const data = await getClient().patch<{ category: Category }>(
    `/budgets/${budgetId}/categories/${categoryId}`,
    { category }
  );
  return data.category;
}

export async function updateMonthCategory(
  budgetId: string,
  month: string,
  categoryId: string,
  data: SaveMonthCategory
): Promise<Category> {
  const result = await getClient().patch<{ category: Category }>(
    `/budgets/${budgetId}/months/${month}/categories/${categoryId}`,
    { category: data }
  );
  return result.category;
}

export async function createCategory(
  budgetId: string,
  category: SaveCategory
): Promise<Category> {
  const data = await getClient().post<{ category: Category }>(
    `/budgets/${budgetId}/categories`,
    { category }
  );
  return data.category;
}

export async function createCategoryGroup(
  budgetId: string,
  group: SaveCategoryGroup
): Promise<CategoryGroup> {
  const data = await getClient().post<{ category_group: CategoryGroup }>(
    `/budgets/${budgetId}/category_groups`,
    { category_group: group }
  );
  return data.category_group;
}

export async function updateCategoryGroup(
  budgetId: string,
  groupId: string,
  group: SaveCategoryGroup
): Promise<CategoryGroup> {
  const data = await getClient().patch<{ category_group: CategoryGroup }>(
    `/budgets/${budgetId}/category_groups/${groupId}`,
    { category_group: group }
  );
  return data.category_group;
}

export async function resolveCategoryId(
  budgetId: string,
  nameOrId: string
): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)) {
    return nameOrId;
  }
  const { category_groups } = await getCategories(budgetId);
  for (const group of category_groups) {
    const match = group.categories.find(
      (c) => c.name.toLowerCase() === nameOrId.toLowerCase()
    );
    if (match) return match.id;
  }
  const allNames = category_groups.flatMap((g) =>
    g.categories.map((c) => `${g.name}/${c.name}`)
  );
  throw new Error(
    `Category "${nameOrId}" not found. Available: ${allNames.join(", ")}`
  );
}
