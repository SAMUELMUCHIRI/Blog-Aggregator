import { setUser } from "./config.js";
import { tryreadConfig } from "./lib/db/index.js";
import type { CommandsRegistry, CommandHandler } from "../config";
import {
  createUser,
  getUser,
  deleteAllUsers,
  getUsers,
} from "./../src/lib/db/queries/users.js";
import { get } from "https";

export async function handlerLogin(cmdName: string, ...args: string[]) {
  if (!args || args.length === 0) {
    throw Error("Usage: login <username>");
  }
  await getUser(args[0]);

  try {
    const user = await getUser(args[0]);
    if (!user) {
      console.error(`User not found ${args[0]}`);
      process.exit(1);
    }
    const username = args[0];
    await setUser(username);
    console.log(`Logged in as ${username}`);
    return Promise.resolve();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];
  if (!handler) {
    throw Error(`Command ${cmdName} not found`);
  }
  await handler(cmdName, ...args);
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
  if (!args || args.length === 0) {
    throw Error("Usage: register <username>");
  }

  try {
    const username = args[0];
    const response: any = await createUser(username);
    if ("Error" in response) {
      console.error(`User Exists ${username}`);
      process.exit(1);
    }
    await setUser(username);
    console.log(`Registered and logged in as ${username}`);
    return Promise.resolve();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export async function handlerReset(cmdName: string, ...args: string[]) {
  try {
    await deleteAllUsers();
    console.log(`Deleted all users`);
    return Promise.resolve();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export async function handlerUsers(cmdName: string, ...args: string[]) {
  try {
    const users = await getUsers();
    if (!users || users.length === 0) {
      console.log("No users found");
      return Promise.resolve();
    }
    const currentUser = tryreadConfig();
    for (const user of users) {
      if (currentUser.currentUserName === user.name) {
        console.log(`* ${user.name} (current)`);
      } else {
        console.log(`* ${user.name}`);
      }
    }

    return Promise.resolve();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
