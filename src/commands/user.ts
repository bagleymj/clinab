import { Command } from "commander";
import { getUser } from "../api/user.ts";
import { printDetail, printJson, isJsonMode } from "../formatters/output.ts";

export function userCommand(): Command {
  const cmd = new Command("user")
    .description("Show authenticated user information")
    .action(async () => {
      const user = await getUser();
      if (isJsonMode()) {
        printJson(user);
        return;
      }
      printDetail([{ label: "User ID", value: user.id }]);
    });

  return cmd;
}
