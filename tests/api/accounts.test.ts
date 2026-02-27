import { test, expect, describe, beforeAll } from "bun:test";
import { initClient } from "../../src/api/client.ts";
import {
  getAccounts,
  getAccount,
  createAccount,
  resolveAccountId,
} from "../../src/api/accounts.ts";

const YNAB_TOKEN = process.env.YNAB_TOKEN;
const DEVPLAN_ID = "77d887b7-cc1d-4395-8e67-3c166dc5b04c";

describe("accounts API", () => {
  let testAccountId: string;

  beforeAll(() => {
    if (!YNAB_TOKEN) throw new Error("YNAB_TOKEN required for account tests");
    initClient(YNAB_TOKEN);
  });

  test("createAccount creates a checking account", async () => {
    const account = await createAccount(DEVPLAN_ID, {
      name: "Test Checking",
      type: "checking",
      balance: 5000000, // $5,000
    });
    expect(account).toBeDefined();
    expect(account.name).toBe("Test Checking");
    expect(account.type).toBe("checking");
    expect(account.balance).toBe(5000000);
    expect(account.on_budget).toBe(true);
    testAccountId = account.id;
  });

  test("createAccount creates a savings account", async () => {
    const account = await createAccount(DEVPLAN_ID, {
      name: "Test Savings",
      type: "savings",
      balance: 10000000, // $10,000
    });
    expect(account).toBeDefined();
    expect(account.name).toBe("Test Savings");
    expect(account.type).toBe("savings");
  });

  test("createAccount creates a credit card", async () => {
    const account = await createAccount(DEVPLAN_ID, {
      name: "Test Visa",
      type: "creditCard",
      balance: -500000, // -$500 (owed)
    });
    expect(account).toBeDefined();
    expect(account.name).toBe("Test Visa");
    expect(account.type).toBe("creditCard");
    expect(account.balance).toBe(-500000);
  });

  test("getAccounts returns all accounts", async () => {
    const { accounts, server_knowledge } = await getAccounts(DEVPLAN_ID);
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBeGreaterThanOrEqual(3);
    expect(typeof server_knowledge).toBe("number");
  });

  test("getAccount returns a specific account", async () => {
    const { accounts } = await getAccounts(DEVPLAN_ID);
    const first = accounts[0]!;
    const account = await getAccount(DEVPLAN_ID, first.id);
    expect(account.id).toBe(first.id);
    expect(account.name).toBe(first.name);
  });

  test("each account has required fields", async () => {
    const { accounts } = await getAccounts(DEVPLAN_ID);
    for (const account of accounts) {
      expect(account.id).toBeTruthy();
      expect(account.name).toBeTruthy();
      expect(account.type).toBeTruthy();
      expect(typeof account.balance).toBe("number");
      expect(typeof account.on_budget).toBe("boolean");
      expect(typeof account.closed).toBe("boolean");
      expect(typeof account.deleted).toBe("boolean");
    }
  });

  test("resolveAccountId resolves by name", async () => {
    const id = await resolveAccountId(DEVPLAN_ID, "Test Checking");
    expect(id).toBeTruthy();
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ).toBe(true);
  });

  test("resolveAccountId is case-insensitive", async () => {
    const id = await resolveAccountId(DEVPLAN_ID, "test checking");
    expect(id).toBeTruthy();
  });

  test("resolveAccountId passes through UUIDs", async () => {
    const { accounts } = await getAccounts(DEVPLAN_ID);
    const first = accounts[0]!;
    const id = await resolveAccountId(DEVPLAN_ID, first.id);
    expect(id).toBe(first.id);
  });

  test("resolveAccountId throws for unknown account", async () => {
    expect(
      resolveAccountId(DEVPLAN_ID, "nonexistent-account-xyz")
    ).rejects.toThrow(/not found/i);
  });
});
