import os from "os";
import type { CommandsRegistry, CommandHandler } from "../config";
import { handlerLogin, registerCommand, runCommand } from "./functions.js";
import { argv } from "node:process";

function main() {
  const Registry: CommandsRegistry = {};
  registerCommand(Registry, "login", handlerLogin);
  const newArgs = argv.slice(2);
  if (newArgs.length > 0) {
    const finalArgs = argv.slice(3);
    runCommand(Registry, newArgs[0], ...finalArgs);
  } else {
    throw Error("not enough arguments were provided");
  }
}

main();
