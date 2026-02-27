import { getClient } from "./client.ts";
import type { MonthSummary, MonthDetail } from "../types/ynab.ts";

export async function getMonths(
  budgetId: string,
  serverKnowledge?: number
): Promise<{ months: MonthSummary[]; server_knowledge: number }> {
  const params: Record<string, string | number | undefined> = {};
  if (serverKnowledge !== undefined) {
    params.last_knowledge_of_server = serverKnowledge;
  }
  return getClient().get(`/budgets/${budgetId}/months`, params);
}

export async function getMonth(
  budgetId: string,
  month: string
): Promise<MonthDetail> {
  const data = await getClient().get<{ month: MonthDetail }>(
    `/budgets/${budgetId}/months/${month}`
  );
  return data.month;
}
