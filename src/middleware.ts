import type { CommandHandler, UserCommandHandler } from "../config.ts";
import { tryreadConfig } from "./lib/db/index.js";
import { getUser } from "./lib/db/queries/users";

export function middlewareLoggedIn(
  handler: UserCommandHandler,
): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const config = tryreadConfig();
    const userName = config.currentUserName;
    if (!userName) {
      throw new Error("User not logged in");
    }

    const user = await getUser(userName);
    if (!user) {
      throw new Error(`User ${userName} not found`);
    }

    await handler(cmdName, user, ...args);
  };
}
