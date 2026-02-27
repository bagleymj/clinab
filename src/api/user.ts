import { getClient } from "./client.ts";
import type { User } from "../types/ynab.ts";

export async function getUser(): Promise<User> {
  const data = await getClient().get<{ user: User }>("/user");
  return data.user;
}
