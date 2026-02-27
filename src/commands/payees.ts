import { Command } from "commander";
import {
  getPayees,
  getPayee,
  updatePayee,
  getPayeeLocations,
  resolvePayeeId,
} from "../api/payees.ts";
import {
  printTable,
  printDetail,
  printJson,
  printSuccess,
  isJsonMode,
} from "../formatters/output.ts";

function getBudgetId(command: Command): string {
  let parent = command.parent;
  while (parent) {
    const opts = parent.opts();
    if (opts.budget) return opts.budget;
    parent = parent.parent;
  }
  return "last-used";
}

export function payeesCommand(): Command {
  const cmd = new Command("payees")
    .description("Manage payees")
    .addHelpText(
      "after",
      `
Examples:
  clinab payees list                   List all payees
  clinab payees show "Walmart"         Show payee details
  clinab payees rename "Wal-Mart" --name "Walmart"
  clinab payees locations              Show all payee locations`
    );

  cmd
    .command("list")
    .description("List all payees in the budget")
    .action(async (_opts, command) => {
      const budgetId = getBudgetId(command);
      const { payees } = await getPayees(budgetId);
      const filtered = payees.filter((p) => !p.deleted);

      if (isJsonMode()) {
        printJson(filtered);
        return;
      }

      printTable(
        [
          { header: "Name", key: "name" },
          { header: "ID", key: "id" },
          {
            header: "Transfer",
            key: "transfer_account_id",
            formatter: (v) => (v ? "Yes" : "—"),
          },
        ],
        filtered.map((p) => ({
          name: p.name,
          id: p.id,
          transfer_account_id: p.transfer_account_id,
        }))
      );
    });

  cmd
    .command("show <payee>")
    .description("Show details for a payee (by name or ID)")
    .action(async (payee: string, _opts, command) => {
      const budgetId = getBudgetId(command);
      const payeeId = await resolvePayeeId(budgetId, payee);
      const p = await getPayee(budgetId, payeeId);

      if (isJsonMode()) {
        printJson(p);
        return;
      }

      printDetail([
        { label: "Name", value: p.name },
        { label: "ID", value: p.id },
        {
          label: "Transfer Account",
          value: p.transfer_account_id ?? "None",
        },
      ]);
    });

  cmd
    .command("rename <payee>")
    .description("Rename a payee")
    .requiredOption("-n, --name <name>", "New payee name")
    .action(async (payee: string, opts, command) => {
      const budgetId = getBudgetId(command);
      const payeeId = await resolvePayeeId(budgetId, payee);
      const updated = await updatePayee(budgetId, payeeId, {
        name: opts.name,
      });

      if (isJsonMode()) {
        printJson(updated);
        return;
      }
      printSuccess(`Renamed payee to "${updated.name}"`);
    });

  cmd
    .command("locations")
    .description("List all payee locations")
    .action(async (_opts, command) => {
      const budgetId = getBudgetId(command);
      const locations = await getPayeeLocations(budgetId);

      if (isJsonMode()) {
        printJson(locations);
        return;
      }

      if (locations.length === 0) {
        console.log("  No payee locations found.");
        return;
      }

      printTable(
        [
          { header: "Payee ID", key: "payee_id" },
          { header: "Latitude", key: "latitude" },
          { header: "Longitude", key: "longitude" },
        ],
        locations.map((l) => ({
          payee_id: l.payee_id,
          latitude: l.latitude,
          longitude: l.longitude,
        }))
      );
    });

  return cmd;
}
