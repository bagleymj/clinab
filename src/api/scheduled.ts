import { getClient } from "./client.ts";
import type {
  ScheduledTransactionDetail,
  SaveScheduledTransaction,
} from "../types/ynab.ts";

export async function getScheduledTransactions(
  budgetId: string,
  serverKnowledge?: number
): Promise<{
  scheduled_transactions: ScheduledTransactionDetail[];
  server_knowledge: number;
}> {
  const params: Record<string, string | number | undefined> = {};
  if (serverKnowledge !== undefined) {
    params.last_knowledge_of_server = serverKnowledge;
  }
  return getClient().get(
    `/budgets/${budgetId}/scheduled_transactions`,
    params
  );
}

export async function getScheduledTransaction(
  budgetId: string,
  scheduledTransactionId: string
): Promise<ScheduledTransactionDetail> {
  const data = await getClient().get<{
    scheduled_transaction: ScheduledTransactionDetail;
  }>(`/budgets/${budgetId}/scheduled_transactions/${scheduledTransactionId}`);
  return data.scheduled_transaction;
}

export async function createScheduledTransaction(
  budgetId: string,
  transaction: SaveScheduledTransaction
): Promise<ScheduledTransactionDetail> {
  const data = await getClient().post<{
    scheduled_transaction: ScheduledTransactionDetail;
  }>(`/budgets/${budgetId}/scheduled_transactions`, {
    scheduled_transaction: transaction,
  });
  return data.scheduled_transaction;
}

export async function updateScheduledTransaction(
  budgetId: string,
  scheduledTransactionId: string,
  transaction: SaveScheduledTransaction
): Promise<ScheduledTransactionDetail> {
  const data = await getClient().put<{
    scheduled_transaction: ScheduledTransactionDetail;
  }>(
    `/budgets/${budgetId}/scheduled_transactions/${scheduledTransactionId}`,
    { scheduled_transaction: transaction }
  );
  return data.scheduled_transaction;
}

export async function deleteScheduledTransaction(
  budgetId: string,
  scheduledTransactionId: string
): Promise<ScheduledTransactionDetail> {
  const data = await getClient().delete<{
    scheduled_transaction: ScheduledTransactionDetail;
  }>(
    `/budgets/${budgetId}/scheduled_transactions/${scheduledTransactionId}`
  );
  return data.scheduled_transaction;
}
