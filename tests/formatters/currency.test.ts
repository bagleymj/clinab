import { test, expect, describe, beforeEach } from "bun:test";
import {
  milliunitsToAmount,
  amountToMilliunits,
  formatCurrency,
  setCurrencyFormat,
  getCurrencyFormat,
} from "../../src/formatters/currency.ts";
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

const EUR_FORMAT: CurrencyFormat = {
  iso_code: "EUR",
  example_format: "123.456,78",
  decimal_digits: 2,
  decimal_separator: ",",
  symbol_first: false,
  group_separator: ".",
  currency_symbol: "€",
  display_symbol: true,
};

describe("milliunitsToAmount", () => {
  test("converts positive milliunits to dollars", () => {
    expect(milliunitsToAmount(1000)).toBe(1);
    expect(milliunitsToAmount(50000)).toBe(50);
    expect(milliunitsToAmount(1234560)).toBe(1234.56);
  });

  test("converts negative milliunits to dollars", () => {
    expect(milliunitsToAmount(-1000)).toBe(-1);
    expect(milliunitsToAmount(-85500)).toBe(-85.5);
  });

  test("converts zero", () => {
    expect(milliunitsToAmount(0)).toBe(0);
  });

  test("handles fractional milliunits", () => {
    expect(milliunitsToAmount(500)).toBe(0.5);
    expect(milliunitsToAmount(10)).toBe(0.01);
  });
});

describe("amountToMilliunits", () => {
  test("converts dollars to milliunits", () => {
    expect(amountToMilliunits(1)).toBe(1000);
    expect(amountToMilliunits(50)).toBe(50000);
    expect(amountToMilliunits(1234.56)).toBe(1234560);
  });

  test("converts negative amounts", () => {
    expect(amountToMilliunits(-1)).toBe(-1000);
    expect(amountToMilliunits(-85.5)).toBe(-85500);
  });

  test("converts zero", () => {
    expect(amountToMilliunits(0)).toBe(0);
  });

  test("rounds to nearest milliunit", () => {
    expect(amountToMilliunits(1.2345)).toBe(1235);
    expect(amountToMilliunits(1.2344)).toBe(1234);
  });

  test("roundtrip conversion is stable", () => {
    const amounts = [0, 1, -1, 100.5, -85.5, 1234.56, -0.01];
    for (const amount of amounts) {
      const milliunits = amountToMilliunits(amount);
      const roundtrip = milliunitsToAmount(milliunits);
      expect(roundtrip).toBeCloseTo(amount, 2);
    }
  });
});

describe("formatCurrency", () => {
  beforeEach(() => {
    setCurrencyFormat(USD_FORMAT);
  });

  test("formats positive USD amounts", () => {
    expect(formatCurrency(1000)).toBe("$1.00");
    expect(formatCurrency(50000)).toBe("$50.00");
    expect(formatCurrency(1234560)).toBe("$1,234.56");
  });

  test("formats negative USD amounts", () => {
    expect(formatCurrency(-1000)).toBe("-$1.00");
    expect(formatCurrency(-85500)).toBe("-$85.50");
  });

  test("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  test("formats large amounts with group separators", () => {
    expect(formatCurrency(1000000000)).toBe("$1,000,000.00");
    expect(formatCurrency(123456789000)).toBe("$123,456,789.00");
  });

  test("formats EUR with symbol after and comma decimal", () => {
    expect(formatCurrency(1234560, EUR_FORMAT)).toBe("1.234,56€");
  });

  test("formats without symbol when display_symbol is false", () => {
    const noSymbol = { ...USD_FORMAT, display_symbol: false };
    expect(formatCurrency(1000, noSymbol)).toBe("1.00");
  });

  test("uses set currency format", () => {
    setCurrencyFormat(EUR_FORMAT);
    expect(formatCurrency(1234560)).toBe("1.234,56€");
  });
});

describe("getCurrencyFormat / setCurrencyFormat", () => {
  test("returns default USD format initially", () => {
    setCurrencyFormat(USD_FORMAT);
    const fmt = getCurrencyFormat();
    expect(fmt.iso_code).toBe("USD");
  });

  test("set and get roundtrip", () => {
    setCurrencyFormat(EUR_FORMAT);
    const fmt = getCurrencyFormat();
    expect(fmt.iso_code).toBe("EUR");
    expect(fmt.decimal_separator).toBe(",");
    // Reset
    setCurrencyFormat(USD_FORMAT);
  });
});
