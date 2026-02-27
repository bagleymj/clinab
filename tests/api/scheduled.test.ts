import { test, expect, describe, beforeAll } from "bun:test";
import { initClient } from "../../src/api/client.ts";
import { getAccounts } from "../../src/api/accounts.ts";
import { resolveCategoryId } from "../../src/api/categories.ts";
import {
  getScheduledTransactions,
  getScheduledTransaction,
  createScheduledTransaction,
  deleteScheduledTransaction,
} from "../../src/api/scheduled.ts";

const YNAB_TOKEN = process.env.YNAB_TOKEN;
const DEVPLAN_ID = "77d887b7-cc1d-4395-8e67-3c166dc5b04c";

describe("scheduled transactions API", () => {
  let accountId: string;
  let categoryId: string;
  let scheduledId: string;

  beforeAll(async () => {
    if (!YNAB_TOKEN) throw new Error("YNAB_TOKEN required");
    initClient(YNAB_TOKEN);

    const { accounts } = await getAccounts(DEVPLAN_ID);
    const checking = accounts.find((a) => a.name === "Test Checking");
    if (!checking) throw new Error("Test Checking account not found");
    accountId = checking.id;

    categoryId = await resolveCategoryId(DEVPLAN_ID, "Rent/Mortgage");
  });

  test("createScheduledTransaction creates a recurring transaction", async () => {
    const txn = await createScheduledTransaction(DEVPLAN_ID, {
      account_id: accountId,
      date: "2026-03-01",
      amount: -1200000, // -$1,200
      frequency: "monthly",
      payee_name: "Landlord",
      category_id: categoryId,
      memo: "Monthly rent",
    });
    expect(txn).toBeDefined();
    expect(txn.id).toBeTruthy();
    expect(txn.amount).toBe(-1200000);
    expect(txn.frequency).toBe("monthly");
    expect(txn.payee_name).toBe("Landlord");
    expect(txn.memo).toBe("Monthly rent");
    scheduledId = txn.id;
  });

  test("getScheduledTransactions returns all scheduled", async () => {
    const { scheduled_transactions, server_knowledge } =
      await getScheduledTransactions(DEVPLAN_ID);
    expect(Array.isArray(scheduled_transactions)).toBe(true);
    expect(scheduled_transactions.length).toBeGreaterThanOrEqual(1);
    expect(typeof server_knowledge).toBe("number");
  });

  test("getScheduledTransaction returns specific transaction", async () => {
    const txn = await getScheduledTransaction(DEVPLAN_ID, scheduledId);
    expect(txn.id).toBe(scheduledId);
    expect(txn.amount).toBe(-1200000);
    expect(txn.frequency).toBe("monthly");
  });

  test("scheduled transaction has required fields", async () => {
    const txn = await getScheduledTransaction(DEVPLAN_ID, scheduledId);
    expect(txn.id).toBeTruthy();
    expect(txn.date_first).toBeTruthy();
    expect(txn.date_next).toBeTruthy();
    expect(txn.frequency).toBeTruthy();
    expect(typeof txn.amount).toBe("number");
    expect(txn.account_id).toBeTruthy();
    expect(txn.account_name).toBeTruthy();
    expect(Array.isArray(txn.subtransactions)).toBe(true);
  });

  test("deleteScheduledTransaction deletes the transaction", async () => {
    const txn = await deleteScheduledTransaction(DEVPLAN_ID, scheduledId);
    expect(txn.deleted).toBe(true);
  });
});
