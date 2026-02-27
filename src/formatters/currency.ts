import type { Milliunits, CurrencyFormat } from "../types/ynab.ts";

const DEFAULT_FORMAT: CurrencyFormat = {
  iso_code: "USD",
  example_format: "123,456.78",
  decimal_digits: 2,
  decimal_separator: ".",
  symbol_first: true,
  group_separator: ",",
  currency_symbol: "$",
  display_symbol: true,
};

let _currencyFormat: CurrencyFormat = DEFAULT_FORMAT;

export function setCurrencyFormat(format: CurrencyFormat): void {
  _currencyFormat = format;
}

export function getCurrencyFormat(): CurrencyFormat {
  return _currencyFormat;
}

export function milliunitsToAmount(milliunits: Milliunits): number {
  return milliunits / 1000;
}

export function amountToMilliunits(amount: number): Milliunits {
  return Math.round(amount * 1000);
}

export function formatCurrency(milliunits: Milliunits, format?: CurrencyFormat): string {
  const fmt = format ?? _currencyFormat;
  const amount = milliunitsToAmount(milliunits);
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const parts = absAmount.toFixed(fmt.decimal_digits).split(".");
  const intPart = parts[0]!;
  const decPart = parts[1];

  // Add group separators
  let grouped = "";
  for (let i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 === 0) {
      grouped += fmt.group_separator;
    }
    grouped += intPart[i];
  }

  let formatted = decPart
    ? `${grouped}${fmt.decimal_separator}${decPart}`
    : grouped;

  if (fmt.display_symbol) {
    formatted = fmt.symbol_first
      ? `${fmt.currency_symbol}${formatted}`
      : `${formatted}${fmt.currency_symbol}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr;
}
