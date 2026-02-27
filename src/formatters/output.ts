import chalk from "chalk";
import Table from "cli-table3";
import { formatCurrency } from "./currency.ts";
import type { Milliunits } from "../types/ynab.ts";

let _jsonMode = false;

export function setJsonMode(json: boolean): void {
  _jsonMode = json;
}

export function isJsonMode(): boolean {
  return _jsonMode;
}

export function colorAmount(milliunits: Milliunits): string {
  const formatted = formatCurrency(milliunits);
  if (milliunits > 0) return chalk.green(formatted);
  if (milliunits < 0) return chalk.red(formatted);
  return chalk.dim(formatted);
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printSuccess(message: string): void {
  if (_jsonMode) return;
  console.log(chalk.green("✓") + " " + message);
}

export function printError(message: string): void {
  if (_jsonMode) {
    console.error(JSON.stringify({ error: message }));
  } else {
    console.error(chalk.red("✗") + " " + message);
  }
}

export function printWarning(message: string): void {
  if (_jsonMode) return;
  console.log(chalk.yellow("⚠") + " " + message);
}

export function printInfo(message: string): void {
  if (_jsonMode) return;
  console.log(chalk.blue("ℹ") + " " + message);
}

export interface TableColumn {
  header: string;
  key: string;
  align?: "left" | "right" | "center";
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
}

export function printTable(
  columns: TableColumn[],
  rows: Record<string, unknown>[]
): void {
  if (_jsonMode) {
    printJson(rows);
    return;
  }

  if (rows.length === 0) {
    console.log(chalk.dim("  No results found."));
    return;
  }

  const table = new Table({
    head: columns.map((c) => chalk.bold.cyan(c.header)),
    style: { "padding-left": 1, "padding-right": 1, head: [], border: [] },
    colAligns: columns.map((c) => c.align ?? "left"),
    chars: {
      top: "─",
      "top-mid": "┬",
      "top-left": "┌",
      "top-right": "┐",
      bottom: "─",
      "bottom-mid": "┴",
      "bottom-left": "└",
      "bottom-right": "┘",
      left: "│",
      "left-mid": "├",
      mid: "─",
      "mid-mid": "┼",
      right: "│",
      "right-mid": "┤",
      middle: "│",
    },
  });

  for (const row of rows) {
    table.push(
      columns.map((col) => {
        const value = row[col.key];
        if (col.formatter) {
          return col.formatter(value, row);
        }
        return String(value ?? "");
      })
    );
  }

  console.log(table.toString());
}

export function printDetail(
  fields: { label: string; value: string }[]
): void {
  if (_jsonMode) {
    const obj: Record<string, string> = {};
    for (const f of fields) obj[f.label] = f.value;
    printJson(obj);
    return;
  }

  const maxLabel = Math.max(...fields.map((f) => f.label.length));
  for (const field of fields) {
    const label = chalk.bold(field.label.padEnd(maxLabel));
    console.log(`  ${label}  ${field.value}`);
  }
}
