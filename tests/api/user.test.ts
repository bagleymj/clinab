import { test, expect, describe, beforeAll } from "bun:test";
import { initClient } from "../../src/api/client.ts";
import { getUser } from "../../src/api/user.ts";

const YNAB_TOKEN = process.env.YNAB_TOKEN;

describe("user API", () => {
  beforeAll(() => {
    if (!YNAB_TOKEN) throw new Error("YNAB_TOKEN required");
    initClient(YNAB_TOKEN);
  });

  test("getUser returns user with id", async () => {
    const user = await getUser();
    expect(user).toBeDefined();
    expect(user.id).toBeTruthy();
    expect(typeof user.id).toBe("string");
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
    ).toBe(true);
  });
});
