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
  follow,
  following,
  unfollow,
  start,
  browsePosts,
} from "./functions.js";

import { middlewareLoggedIn } from "./middleware.js";
import { argv } from "node:process";

async function main() {
  const Registry: CommandsRegistry = {};

  registerCommand(Registry, "login", handlerLogin);
  registerCommand(Registry, "register", handlerRegister);
  registerCommand(Registry, "reset", handlerReset);
  registerCommand(Registry, "users", handlerUsers);
  registerCommand(Registry, "agg", agg);
  registerCommand(Registry, "addfeed", middlewareLoggedIn(addfeed));
  registerCommand(Registry, "feeds", feeds);
  registerCommand(Registry, "follow", middlewareLoggedIn(follow));
  registerCommand(Registry, "following", middlewareLoggedIn(following));
  registerCommand(Registry, "unfollow", middlewareLoggedIn(unfollow));
  registerCommand(Registry, "browse", middlewareLoggedIn(browsePosts));

  const newArgs = argv.slice(2);
  if (newArgs.length > 0) {
    const finalArgs = argv.slice(3);
    await runCommand(Registry, newArgs[0], ...finalArgs);
  } else {
    await start();
  }
}

await main();
process.exit(0);
