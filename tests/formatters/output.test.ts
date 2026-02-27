import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import {
  setJsonMode,
  isJsonMode,
  colorAmount,
  printJson,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printTable,
  printDetail,
} from "../../src/formatters/output.ts";
import { setCurrencyFormat } from "../../src/formatters/currency.ts";
import type { CurrencyFormat } from "../../src/types/ynab.ts";

const USD_FORMAT: CurrencyFormat = {
  iso_code: "USD",
  example_format: "123,456.78",
  decimal_digits: 2,
  decimal_separator: ".",
  symbol_first: true,
  group_separator: ",",
  currency_symbol: "$",
  display_symbol: true,
};

describe("JSON mode", () => {
  beforeEach(() => {
    setJsonMode(false);
    setCurrencyFormat(USD_FORMAT);
  });

  test("defaults to false", () => {
    expect(isJsonMode()).toBe(false);
  });

  test("can be set to true", () => {
    setJsonMode(true);
    expect(isJsonMode()).toBe(true);
  });

  test("can be toggled back", () => {
    setJsonMode(true);
    setJsonMode(false);
    expect(isJsonMode()).toBe(false);
  });
});

describe("colorAmount", () => {
  beforeEach(() => {
    setCurrencyFormat(USD_FORMAT);
  });

  test("returns a string for positive amounts", () => {
    const result = colorAmount(1000);
    expect(typeof result).toBe("string");
    expect(result).toContain("1.00");
  });

  test("returns a string for negative amounts", () => {
    const result = colorAmount(-1000);
    expect(typeof result).toBe("string");
    expect(result).toContain("1.00");
  });

  test("returns a string for zero", () => {
    const result = colorAmount(0);
    expect(typeof result).toBe("string");
    expect(result).toContain("0.00");
  });
});

describe("printJson", () => {
  test("outputs valid JSON", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));

    printJson({ foo: "bar", num: 42 });

    console.log = origLog;

    expect(logs.length).toBe(1);
    const parsed = JSON.parse(logs[0]!);
    expect(parsed).toEqual({ foo: "bar", num: 42 });
  });

  test("handles arrays", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));

    printJson([1, 2, 3]);

    console.log = origLog;

    const parsed = JSON.parse(logs[0]!);
    expect(parsed).toEqual([1, 2, 3]);
  });
});

describe("printTable", () => {
  test("prints 'No results found' for empty rows in human mode", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    setJsonMode(false);

    printTable(
      [{ header: "Name", key: "name" }],
      []
    );

    console.log = origLog;

    expect(logs.some((l) => l.includes("No results found"))).toBe(true);
  });

  test("outputs JSON array for empty rows in JSON mode", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    setJsonMode(true);

    printTable(
      [{ header: "Name", key: "name" }],
      []
    );

    console.log = origLog;
    setJsonMode(false);

    const parsed = JSON.parse(logs[0]!);
    expect(parsed).toEqual([]);
  });

  test("prints table with data in human mode", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    setJsonMode(false);

    printTable(
      [
        { header: "Name", key: "name" },
        { header: "Value", key: "value" },
      ],
      [{ name: "Alice", value: "100" }]
    );

    console.log = origLog;

    const output = logs.join("\n");
    expect(output).toContain("Alice");
    expect(output).toContain("100");
  });

  test("applies formatters to columns", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    setJsonMode(false);

    printTable(
      [
        {
          header: "Amount",
          key: "amount",
          formatter: (v) => `$${v}`,
        },
      ],
      [{ amount: 42 }]
    );

    console.log = origLog;

    const output = logs.join("\n");
    expect(output).toContain("$42");
  });
});

describe("printDetail", () => {
  test("prints field labels and values in human mode", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    setJsonMode(false);

    printDetail([
      { label: "Name", value: "Test" },
      { label: "ID", value: "abc-123" },
    ]);

    console.log = origLog;

    const output = logs.join("\n");
    expect(output).toContain("Name");
    expect(output).toContain("Test");
    expect(output).toContain("ID");
    expect(output).toContain("abc-123");
  });

  test("outputs JSON in JSON mode", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    setJsonMode(true);

    printDetail([
      { label: "Name", value: "Test" },
      { label: "ID", value: "abc-123" },
    ]);

    console.log = origLog;
    setJsonMode(false);

    const parsed = JSON.parse(logs[0]!);
    expect(parsed).toEqual({ Name: "Test", ID: "abc-123" });
  });
});

describe("print utilities", () => {
  test("printSuccess includes check mark in human mode", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    setJsonMode(false);

    printSuccess("It worked!");

    console.log = origLog;
    expect(logs[0]).toContain("It worked!");
  });

  test("printSuccess is silent in JSON mode", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    setJsonMode(true);

    printSuccess("It worked!");

    console.log = origLog;
    setJsonMode(false);
    expect(logs.length).toBe(0);
  });

  test("printError outputs to stderr in JSON mode", () => {
    const logs: string[] = [];
    const origErr = console.error;
    console.error = (...args: unknown[]) => logs.push(args.join(" "));
    setJsonMode(true);

    printError("Something broke");

    console.error = origErr;
    setJsonMode(false);

    const parsed = JSON.parse(logs[0]!);
    expect(parsed).toEqual({ error: "Something broke" });
  });
});
