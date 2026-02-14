import { setUser } from "./config.js";
import { tryreadConfig } from "./lib/db/index.js";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import type { CommandsRegistry, CommandHandler } from "../config";
import {
  createUser,
  getUser,
  deleteAllUsers,
  getUsers,
  createFeed,
  fetch_allfeeds,
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

export async function fetchFeed(feedURL: string) {
  try {
    const data = await fetch(feedURL, {
      headers: {
        "User-Agent": "gator",
      },
    }).then((response) => response.text());
    const parser = new XMLParser();
    let jObj = parser.parse(data);

    if (!jObj.rss.channel) {
      console.error("Invalid feed");
      process.exit(1);
    }

    let title = jObj.rss.channel.title;
    let description = jObj.rss.channel.description;
    let link = jObj.rss.channel.link;
    let items = jObj.rss.channel.item;

    if (!link && !description && !title) {
      console.error("Invalid feed");
      process.exit(1);
    }
    let metadata = {
      title: title,
      description: description,
      link: link,
    };

    let item = {};
    let feedItems = [];

    if (items) {
      if (Array.isArray(items)) {
        feedItems = items;
        let obj_items = [];
        for (const feedItem of feedItems) {
          if (
            feedItem.title &&
            feedItem.description &&
            feedItem.link &&
            feedItem.pubDate
          ) {
            let feed_item = {
              title: feedItem.title,
              description: feedItem.description,
              link: feedItem.link,
              pubDate: feedItem.pubDate,
            };
            obj_items.push(feed_item);
          }
        }
        Object.assign(item, obj_items);
      }
    }
    const result = {
      metadata: metadata,
      item: item,
    };

    return result;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export async function agg(cmdName: string, ...args: string[]) {
  let result = await fetchFeed("https://www.wagslane.dev/index.xml");
  console.log(result);
}

export async function addfeed(mdName: string, ...args: string[]) {
  if (!args || args.length < 2) {
    throw Error('Usage: addfeed "name" "url"');
  }

  try {
    let name = args[0];
    let url = args[1];
    const currentUsername = tryreadConfig();
    if (!currentUsername.currentUserName) {
      console.error(`User not logged in`);
      process.exit(1);
    }
    let current_userid = await getUser(currentUsername.currentUserName);
    let response = await createFeed(name, url, current_userid.id);
    if (!response) {
      console.error(`Error creating feed`);
      process.exit(1);
    }
    console.log(`Added feed ${name} with URL ${url}`);

    return Promise.resolve();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export async function feeds(mdName: string, ...args: string[]) {
  let result = await fetch_allfeeds();
  if (!result) {
    console.error(`Error creating feed`);
    process.exit(1);
  }
  console.log(result);
}
