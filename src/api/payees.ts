import { getClient } from "./client.ts";
import type { Payee, PayeeLocation, SavePayee } from "../types/ynab.ts";

export async function getPayees(
  budgetId: string,
  serverKnowledge?: number
): Promise<{ payees: Payee[]; server_knowledge: number }> {
  const params: Record<string, string | number | undefined> = {};
  if (serverKnowledge !== undefined) {
    params.last_knowledge_of_server = serverKnowledge;
  }
  return getClient().get(`/budgets/${budgetId}/payees`, params);
}

export async function getPayee(
  budgetId: string,
  payeeId: string
): Promise<Payee> {
  const data = await getClient().get<{ payee: Payee }>(
    `/budgets/${budgetId}/payees/${payeeId}`
  );
  return data.payee;
}

export async function updatePayee(
  budgetId: string,
  payeeId: string,
  payee: SavePayee
): Promise<Payee> {
  const data = await getClient().patch<{ payee: Payee }>(
    `/budgets/${budgetId}/payees/${payeeId}`,
    { payee }
  );
  return data.payee;
}

export async function getPayeeLocations(
  budgetId: string
): Promise<PayeeLocation[]> {
  const data = await getClient().get<{ payee_locations: PayeeLocation[] }>(
    `/budgets/${budgetId}/payee_locations`
  );
  return data.payee_locations;
}

export async function getPayeeLocation(
  budgetId: string,
  locationId: string
): Promise<PayeeLocation> {
  const data = await getClient().get<{ payee_location: PayeeLocation }>(
    `/budgets/${budgetId}/payee_locations/${locationId}`
  );
  return data.payee_location;
}

export async function getPayeeLocationsByPayee(
  budgetId: string,
  payeeId: string
): Promise<PayeeLocation[]> {
  const data = await getClient().get<{ payee_locations: PayeeLocation[] }>(
    `/budgets/${budgetId}/payees/${payeeId}/payee_locations`
  );
  return data.payee_locations;
}

export async function resolvePayeeId(
  budgetId: string,
  nameOrId: string
): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)) {
    return nameOrId;
  }
  const { payees } = await getPayees(budgetId);
  const match = payees.find(
    (p) => p.name.toLowerCase() === nameOrId.toLowerCase()
  );
  if (!match) {
    const names = payees.filter((p) => !p.deleted).map((p) => p.name).join(", ");
    throw new Error(
      `Payee "${nameOrId}" not found. Available payees: ${names}`
    );
  }
  return match.id;
}
