import { getClient } from "./client.ts";
import type { Account, SaveAccount } from "../types/ynab.ts";

export async function getAccounts(
  budgetId: string,
  serverKnowledge?: number
): Promise<{ accounts: Account[]; server_knowledge: number }> {
  const params: Record<string, string | number | undefined> = {};
  if (serverKnowledge !== undefined) {
    params.last_knowledge_of_server = serverKnowledge;
  }
  return getClient().get(`/budgets/${budgetId}/accounts`, params);
}

export async function getAccount(
  budgetId: string,
  accountId: string
): Promise<Account> {
  const data = await getClient().get<{ account: Account }>(
    `/budgets/${budgetId}/accounts/${accountId}`
  );
  return data.account;
}

export async function createAccount(
  budgetId: string,
  account: SaveAccount
): Promise<Account> {
  const data = await getClient().post<{ account: Account }>(
    `/budgets/${budgetId}/accounts`,
    { account }
  );
  return data.account;
}

export async function resolveAccountId(
  budgetId: string,
  nameOrId: string
): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)) {
    return nameOrId;
  }
  const { accounts } = await getAccounts(budgetId);
  const match = accounts.find(
    (a) => a.name.toLowerCase() === nameOrId.toLowerCase()
  );
  if (!match) {
    const names = accounts.map((a) => a.name).join(", ");
    throw new Error(
      `Account "${nameOrId}" not found. Available accounts: ${names}`
    );
  }
  return match.id;
}
