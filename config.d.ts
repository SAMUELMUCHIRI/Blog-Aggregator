import { feeds, users } from "./src/lib/db/schema.ts";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};
export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;
export type CommandsRegistry = {
  [key: string]: CommandHandler;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type Feed = typeof feeds.$inferSelect; // feeds is the table object in schema.ts
export type Users = typeof users.$inferSelect; // users is the table object in schema.ts
