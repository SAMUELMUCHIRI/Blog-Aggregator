import { setUser, readConfig } from "./config.js";
import type { CommandsRegistry, CommandHandler } from "../config";

export function handlerLogin(cmdName: string, ...args: string[]) {
  if (!args || args.length === 0) {
    throw Error("Usage: login <username>");
  }

  const username = args[0];
  setUser(username);
  console.log(`Logged in as ${username}`);
}

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

export function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];
  if (!handler) {
    throw Error(`Command ${cmdName} not found`);
  }
  handler(cmdName, ...args);
}
