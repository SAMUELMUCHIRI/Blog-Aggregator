import type { CommandsRegistry, CommandHandler } from "../config";
import {
  handlerLogin,
  registerCommand,
  runCommand,
  handlerRegister,
  handlerReset,
  handlerUsers,
  agg,
  addfeed,
  feeds,
} from "./functions.js";
import { argv } from "node:process";

async function main() {
  const Registry: CommandsRegistry = {};
  registerCommand(Registry, "login", handlerLogin);
  registerCommand(Registry, "register", handlerRegister);
  registerCommand(Registry, "reset", handlerReset);
  registerCommand(Registry, "users", handlerUsers);
  registerCommand(Registry, "agg", agg);
  registerCommand(Registry, "addfeed", addfeed);
  registerCommand(Registry, "feeds", feeds);

  const newArgs = argv.slice(2);
  if (newArgs.length > 0) {
    const finalArgs = argv.slice(3);
    await runCommand(Registry, newArgs[0], ...finalArgs);
  } else {
    throw Error("not enough arguments were provided");
  }
}

await main();
process.exit(0);
