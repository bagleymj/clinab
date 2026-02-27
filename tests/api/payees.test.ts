import { test, expect, describe, beforeAll } from "bun:test";
import { initClient } from "../../src/api/client.ts";
import {
  getPayees,
  getPayee,
  getPayeeLocations,
  resolvePayeeId,
} from "../../src/api/payees.ts";

const YNAB_TOKEN = process.env.YNAB_TOKEN;
const DEVPLAN_ID = "77d887b7-cc1d-4395-8e67-3c166dc5b04c";

describe("payees API", () => {
  beforeAll(() => {
    if (!YNAB_TOKEN) throw new Error("YNAB_TOKEN required");
    initClient(YNAB_TOKEN);
  });

  test("getPayees returns payees array", async () => {
    const { payees, server_knowledge } = await getPayees(DEVPLAN_ID);
    expect(Array.isArray(payees)).toBe(true);
    expect(payees.length).toBeGreaterThan(0);
    expect(typeof server_knowledge).toBe("number");
  });

  test("payees have required fields", async () => {
    const { payees } = await getPayees(DEVPLAN_ID);
    for (const payee of payees) {
      expect(payee.id).toBeTruthy();
      expect(payee.name).toBeTruthy();
      expect(typeof payee.deleted).toBe("boolean");
    }
  });

  test("getPayee returns a specific payee", async () => {
    const { payees } = await getPayees(DEVPLAN_ID);
    const first = payees[0]!;
    const payee = await getPayee(DEVPLAN_ID, first.id);
    expect(payee.id).toBe(first.id);
    expect(payee.name).toBe(first.name);
  });

  test("resolvePayeeId resolves system payee by name", async () => {
    const id = await resolvePayeeId(DEVPLAN_ID, "Starting Balance");
    expect(id).toBeTruthy();
  });

  test("resolvePayeeId passes through UUIDs", async () => {
    const { payees } = await getPayees(DEVPLAN_ID);
    const first = payees[0]!;
    const id = await resolvePayeeId(DEVPLAN_ID, first.id);
    expect(id).toBe(first.id);
  });

  test("resolvePayeeId throws for unknown payee", async () => {
    expect(
      resolvePayeeId(DEVPLAN_ID, "nonexistent-payee-xyz")
    ).rejects.toThrow(/not found/i);
  });

  test("getPayeeLocations returns array", async () => {
    const locations = await getPayeeLocations(DEVPLAN_ID);
    expect(Array.isArray(locations)).toBe(true);
  });
});
