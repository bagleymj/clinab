import { test, expect, describe, beforeAll } from "bun:test";
import { initClient } from "../../src/api/client.ts";
import { getAccounts } from "../../src/api/accounts.ts";
import { resolveCategoryId } from "../../src/api/categories.ts";
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByAccount,
  getTransactionsByCategory,
} from "../../src/api/transactions.ts";

const YNAB_TOKEN = process.env.YNAB_TOKEN;
const DEVPLAN_ID = "77d887b7-cc1d-4395-8e67-3c166dc5b04c";

describe("transactions API", () => {
  let accountId: string;
  let categoryId: string;
  let transactionId: string;

  beforeAll(async () => {
    if (!YNAB_TOKEN) throw new Error("YNAB_TOKEN required");
    initClient(YNAB_TOKEN);

    // Get account and category for tests
    const { accounts } = await getAccounts(DEVPLAN_ID);
    const checking = accounts.find((a) => a.name === "Test Checking");
    if (!checking) throw new Error("Test Checking account not found - run account tests first");
    accountId = checking.id;

    categoryId = await resolveCategoryId(DEVPLAN_ID, "Groceries");
  });

  test("createTransaction creates a transaction", async () => {
    const result = await createTransaction(DEVPLAN_ID, {
      account_id: accountId,
      date: "2026-02-26",
      amount: -50000, // -$50
      payee_name: "Test Store",
      category_id: categoryId,
      memo: "Test purchase",
      cleared: "cleared",
      approved: true,
    });
    expect(result).toBeDefined();
    expect(result.transaction_ids).toBeDefined();
    expect(result.transaction_ids.length).toBe(1);
    transactionId = result.transaction_ids[0]!;
  });

  test("createTransaction with positive inflow", async () => {
    const result = await createTransaction(DEVPLAN_ID, {
      account_id: accountId,
      date: "2026-02-26",
      amount: 100000, // +$100 income
      payee_name: "Employer",
      memo: "Paycheck",
      cleared: "cleared",
      approved: true,
    });
    expect(result.transaction_ids.length).toBe(1);
  });

  test("getTransaction returns the created transaction", async () => {
    const txn = await getTransaction(DEVPLAN_ID, transactionId);
    expect(txn.id).toBe(transactionId);
    expect(txn.amount).toBe(-50000);
    expect(txn.payee_name).toBe("Test Store");
    expect(txn.memo).toBe("Test purchase");
    expect(txn.cleared).toBe("cleared");
    expect(txn.approved).toBe(true);
    expect(txn.account_name).toBe("Test Checking");
    expect(txn.category_name).toBe("Groceries");
  });

  test("getTransactions returns all transactions", async () => {
    const { transactions, server_knowledge } = await getTransactions(DEVPLAN_ID);
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThanOrEqual(2);
    expect(typeof server_knowledge).toBe("number");
  });

  test("getTransactions with since_date filter", async () => {
    const { transactions } = await getTransactions(DEVPLAN_ID, {
      since_date: "2026-02-25",
    });
    expect(transactions.length).toBeGreaterThanOrEqual(2);

    // All transactions should be on or after the filter date
    for (const txn of transactions) {
      expect(txn.date >= "2026-02-25").toBe(true);
    }
  });

  test("getTransactionsByAccount filters by account", async () => {
    const { transactions } = await getTransactionsByAccount(
      DEVPLAN_ID,
      accountId
    );
    expect(transactions.length).toBeGreaterThanOrEqual(2);
    for (const txn of transactions) {
      expect(txn.account_id).toBe(accountId);
    }
  });

  test("getTransactionsByCategory filters by category", async () => {
    const { transactions } = await getTransactionsByCategory(
      DEVPLAN_ID,
      categoryId
    );
    expect(transactions.length).toBeGreaterThanOrEqual(1);
  });

  test("updateTransaction modifies a transaction", async () => {
    const txn = await updateTransaction(DEVPLAN_ID, transactionId, {
      account_id: accountId,
      date: "2026-02-26",
      amount: -75000, // changed to -$75
      payee_name: "Test Store Updated",
      category_id: categoryId,
      memo: "Updated test purchase",
      cleared: "cleared",
    });
    expect(txn.amount).toBe(-75000);
    expect(txn.payee_name).toBe("Test Store Updated");
    expect(txn.memo).toBe("Updated test purchase");
  });

  test("transaction fields are correct types", async () => {
    const txn = await getTransaction(DEVPLAN_ID, transactionId);
    expect(typeof txn.id).toBe("string");
    expect(typeof txn.date).toBe("string");
    expect(typeof txn.amount).toBe("number");
    expect(typeof txn.cleared).toBe("string");
    expect(typeof txn.approved).toBe("boolean");
    expect(typeof txn.account_id).toBe("string");
    expect(typeof txn.account_name).toBe("string");
    expect(Array.isArray(txn.subtransactions)).toBe(true);
  });

  test("deleteTransaction deletes a transaction", async () => {
    const txn = await deleteTransaction(DEVPLAN_ID, transactionId);
    expect(txn.deleted).toBe(true);
  });
});
