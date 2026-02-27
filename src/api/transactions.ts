import { getClient } from "./client.ts";
import type {
  TransactionDetail,
  HybridTransaction,
  SaveTransaction,
  UpdateTransaction,
  SaveTransactionsResponseData,
} from "../types/ynab.ts";

interface TransactionListParams {
  since_date?: string;
  type?: "uncategorized" | "unapproved";
  last_knowledge_of_server?: number;
}

function buildParams(p: TransactionListParams): Record<string, string | number | undefined> {
  return {
    since_date: p.since_date,
    type: p.type,
    last_knowledge_of_server: p.last_knowledge_of_server,
  };
}

export async function getTransactions(
  budgetId: string,
  params: TransactionListParams = {}
): Promise<{ transactions: TransactionDetail[]; server_knowledge: number }> {
  return getClient().get(
    `/budgets/${budgetId}/transactions`,
    buildParams(params)
  );
}

export async function getTransaction(
  budgetId: string,
  transactionId: string
): Promise<TransactionDetail> {
  const data = await getClient().get<{ transaction: TransactionDetail }>(
    `/budgets/${budgetId}/transactions/${transactionId}`
  );
  return data.transaction;
}

export async function createTransaction(
  budgetId: string,
  transaction: SaveTransaction
): Promise<SaveTransactionsResponseData> {
  return getClient().post(
    `/budgets/${budgetId}/transactions`,
    { transaction }
  );
}

export async function createTransactions(
  budgetId: string,
  transactions: SaveTransaction[]
): Promise<SaveTransactionsResponseData> {
  return getClient().post(
    `/budgets/${budgetId}/transactions`,
    { transactions }
  );
}

export async function updateTransaction(
  budgetId: string,
  transactionId: string,
  transaction: SaveTransaction
): Promise<TransactionDetail> {
  const data = await getClient().put<{ transaction: TransactionDetail }>(
    `/budgets/${budgetId}/transactions/${transactionId}`,
    { transaction }
  );
  return data.transaction;
}

export async function updateTransactions(
  budgetId: string,
  transactions: UpdateTransaction[]
): Promise<SaveTransactionsResponseData> {
  return getClient().patch(
    `/budgets/${budgetId}/transactions`,
    { transactions }
  );
}

export async function deleteTransaction(
  budgetId: string,
  transactionId: string
): Promise<TransactionDetail> {
  const data = await getClient().delete<{ transaction: TransactionDetail }>(
    `/budgets/${budgetId}/transactions/${transactionId}`
  );
  return data.transaction;
}

export async function importTransactions(
  budgetId: string
): Promise<{ transaction_ids: string[] }> {
  return getClient().post(
    `/budgets/${budgetId}/transactions/import`,
    {}
  );
}

export async function getTransactionsByAccount(
  budgetId: string,
  accountId: string,
  params: TransactionListParams = {}
): Promise<{ transactions: TransactionDetail[]; server_knowledge: number }> {
  return getClient().get(
    `/budgets/${budgetId}/accounts/${accountId}/transactions`,
    buildParams(params)
  );
}

export async function getTransactionsByCategory(
  budgetId: string,
  categoryId: string,
  params: TransactionListParams = {}
): Promise<{ transactions: HybridTransaction[]; server_knowledge: number }> {
  return getClient().get(
    `/budgets/${budgetId}/categories/${categoryId}/transactions`,
    buildParams(params)
  );
}

export async function getTransactionsByPayee(
  budgetId: string,
  payeeId: string,
  params: TransactionListParams = {}
): Promise<{ transactions: HybridTransaction[]; server_knowledge: number }> {
  return getClient().get(
    `/budgets/${budgetId}/payees/${payeeId}/transactions`,
    buildParams(params)
  );
}

export async function getTransactionsByMonth(
  budgetId: string,
  month: string,
  params: TransactionListParams = {}
): Promise<{ transactions: TransactionDetail[]; server_knowledge: number }> {
  return getClient().get(
    `/budgets/${budgetId}/months/${month}/transactions`,
    buildParams(params)
  );
}
