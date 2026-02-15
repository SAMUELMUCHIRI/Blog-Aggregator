import { setUser } from "./config.js";
import { tryreadConfig } from "./lib/db/index.js";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import type {
  CommandsRegistry,
  CommandHandler,
  UserCommandHandler,
  User,
  Feed,
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
  getNextFeedToFetch,
  markFeedFetched,
  createPost,
  browse,
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

    type postItem = {
      title: string;
      description: string;
      link: string;
      pubDate: string;
    };

    let metadata = {
      title: title,
      description: description,
      link: link,
    };

    let item: postItem[] = [];
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
async function fetchfeed_url(url: string, id: string) {
  let result = await fetchFeed(url);
  console.log("Metadata\n");
  console.log(result.metadata);
  console.log("\nItems\n");
  for (let items of Object.values(result.item)) {
    if (items) {
      const store = await createPost(
        items.title,
        items.link,
        items.description,
        items.pubDate,
        id,
      );
    }
  }
  return result;
}
export async function agg(cmdName: string, ...args: string[]) {
  if (!args || args.length < 1) {
    throw Error('Usage: agg "interval" //  interval like  1s, 1m, 1h');
  }
  try {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = args[0].match(regex);
    if (!match) {
      throw Error("Invalid interval");
    }
    const digits_regex = /\d+(?=[A-Za-z])/;
    const units_regex = /[A-Za-z]+$/;
    let digits = args[0].match(digits_regex);
    let units = args[0].match(units_regex);
    let interval = 0;

    if (!digits || !units) {
      throw Error("Invalid interval");
    }
    console.log(`Collecting feeds every ${digits[0]} ${units[0]}`);

    if (units[0] === "ms") {
      interval = parseInt(digits[0]);
    } else if (units[0] === "s") {
      interval = parseInt(digits[0]) * 1000;
    } else if (units[0] === "m") {
      interval = parseInt(digits[0]) * 60 * 1000;
    } else if (units[0] === "h") {
      interval = parseInt(digits[0]) * 60 * 60 * 1000;
    }

    scrapeFeeds();

    const interval_fetch = setInterval(() => {
      scrapeFeeds();
    }, interval);

    await new Promise<void>((resolve) => {
      process.on("SIGINT", () => {
        console.log("Shutting down feed aggregator...");
        clearInterval(interval);
        resolve();
      });
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
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

export async function scrapeFeeds() {
  const nextFeedUrl = await getNextFeedToFetch();
  if (!nextFeedUrl) {
    console.log("No feeds to fetch");
    return;
  }
  if (!nextFeedUrl.url) {
    console.log("No feeds to fetch url null");
    return;
  }

  const markFetch = await markFeedFetched(nextFeedUrl.id);

  const feedData = await fetchfeed_url(nextFeedUrl.url, nextFeedUrl.id);
  console.log(
    `Feed ${feedData.metadata.title} collected, ${
      Object.keys(feedData.item).length
    } posts found`,
  );
}

function handleError(err: unknown) {
  console.error(
    `Error scraping feeds: ${err instanceof Error ? err.message : err}`,
  );
}

export async function browsePosts(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  const red = "\x1b[31m";
  const green = "\x1b[32m";
  const yellow = "\x1b[33m";
  const blue = "\x1b[34m";
  const reset = "\x1b[0m";

  const posts = await browse(user.id);
  console.log("Latest Posts in the Blog-Aggregator:");
  posts.forEach((post) => {
    console.log(`- ${post.title} `);
    console.log(`   ${blue}(${post.url})${reset}`);
    if (post.description) {
      console.log(
        `  ${green} ${compressToHalfScreenLines(post.description)}${reset}\n`,
      );
    }

    console.log(`  ${yellow}  ${post.publishedAt}${reset}\n `);
  });
}

function compressToHalfScreenLines(html: string) {
  const text = html.replace(/<[^>]*>/g, ""); // strip HTML tags
  const halfWidth = Math.floor(process.stdout.columns / 2);

  // Split text into words
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > halfWidth) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += " " + word;
    }
  }

  if (currentLine) lines.push(currentLine.trim());

  return lines.join("\n");
}
