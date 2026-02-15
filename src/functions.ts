import { setUser } from "./config.js";
import { tryreadConfig } from "./lib/db/index.js";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import type {
  CommandsRegistry,
  CommandHandler,
  UserCommandHandler,
  User,
} from "../config";
import {
  createUser,
  getUser,
  deleteAllUsers,
  getUsers,
  createFeed,
  fetch_allfeeds,
  createFeedFollow,
  FeedFollowsForUser,
  feedid,
  deleteFeedFollow,
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

export async function addfeed(cmdName: string, user: User, ...args: string[]) {
  if (!args || args.length < 2) {
    throw Error('Usage: addfeed "name" "url"');
  }

  try {
    let name = args[0];
    let url = args[1];
    let response = await createFeed(name, url, user.id);
    if (!response) {
      console.error(`Error creating feed`);
      process.exit(1);
    }
    console.log(`Added feed ${name} with URL ${url}`);

    let response_feedfollow = await createFeedFollow(
      response.userId,
      response.id,
    );
    console.log(response_feedfollow);
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

async function currentUserId() {
  const currentUsername = tryreadConfig();
  if (!currentUsername.currentUserName) {
    console.error(`User not logged in`);
    process.exit(1);
  }
  let current_userid = await getUser(currentUsername.currentUserName);
  return current_userid.id;
}

export async function follow(cmdName: string, user: User, ...args: string[]) {
  if (!args || args.length < 1) {
    throw Error('Usage: follow  "url"');
  }
  try {
    let url = args[0];

    const feedId = await feedid(url);
    if (!feedId) {
      console.error(`Feed not found`);
      process.exit(1);
    }
    const All_feeds = await createFeedFollow(user.id, feedId.id);
    console.log(All_feeds);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export async function getFeedFollowsForUser(userId: string) {
  const result = await FeedFollowsForUser(userId);
  if (!result) {
    console.error(`Error fetching feed follows`);
    process.exit(1);
  }
  return result;
}

export async function following(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  const result = await FeedFollowsForUser(user.id);
  if (!result) {
    console.error(`Error fetching feed follows`);
    process.exit(1);
  }
  if (result.length === 0) {
    console.log("No feed follows");
    process.exit(0);
  }
  for (const feed_item of result) {
    console.log(`${feed_item.feedname} : ${feed_item.username}`);
  }
}

async function currentUser() {
  const currentUsername = tryreadConfig();
  if (!currentUsername.currentUserName) {
    console.error(`User not logged in`);
    process.exit(1);
  }
  let current_user = await getUser(currentUsername.currentUserName);
  return current_user;
}

export async function unfollow(cmdName: string, user: User, ...args: string[]) {
  if (!args || args.length < 1) {
    throw Error('Usage: unfollow  "url"');
  }
  try {
    let url = args[0];

    const feedId = await feedid(url);
    if (!feedId) {
      console.error(`Feed not found`);
      process.exit(1);
    }
    const result = await deleteFeedFollow(user.id, feedId.id);
    console.log(`Unfollowed ${url}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export async function start() {
  const red = "\x1b[31m";
  const green = "\x1b[32m";
  const yellow = "\x1b[33m";
  const blue = "\x1b[34m";
  const reset = "\x1b[0m";

  console.log(`------- ${blue}Blog-Aggregator${reset} -------\n`);
  console.log("\tAvailable Commands");
  console.log(`- ${green}login${reset} \t:Gets you into a session`);
  console.log(`- ${green}register${reset} \t:Registers a new user`);
  console.log(`- ${green}reset${reset} \t:Resets the database`);
  console.log(`- ${green}users${reset} \t:Lists all users`);
  console.log(`- ${green}agg${reset} \t\t:Aggregates all feeds`);
  console.log(`- ${green}addfeed${reset} \t:Adds a new feed`);
  console.log(`- ${green}feeds${reset} \t:Lists all feeds`);
  console.log(`- ${green}follow${reset} \t:Follows a feed`);
  console.log(`- ${green}following${reset} \t:Lists all followed feeds`);
  console.log(`- ${green}unfollow${reset} \t:Unfollows a feed`);
}
