import { db } from "..";
import { users, feeds, feedFollows } from "../schema";
import { eq } from "drizzle-orm";

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

export async function getUser(qname: string) {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.name, qname))
    .limit(1)
    .execute();
  return result;
}
export async function getUsers() {
  const result = await db.select({ name: users.name }).from(users).execute();
  return result;
}

export async function deleteAllUsers() {
  await db.delete(users).execute();
}

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name, url, userId })
    .returning();
  return result;
}

export async function fetch_allfeeds() {
  const result = await db
    .select({ name: feeds.name, url: feeds.url, username: users.name })
    .from(users)
    .innerJoin(feeds, eq(users.id, feeds.userId))
    .execute();
  return result;
}

export async function createFeedFollow(userId: string, feedId: string) {
  const [result] = await db
    .insert(feedFollows)
    .values({ userId, feedId })
    .returning();

  const selecting_feeds = await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      name: feeds.name,
      username: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .execute();

  return selecting_feeds;
}

export async function FeedFollowsForUser(userId: string) {
  const result = await db
    .select({
      feedname: feeds.name,
      username: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .where(eq(feedFollows.userId, userId))
    .execute();

  return result;
}

export async function feedid(url: string) {
  const [result] = await db
    .select({
      id: feeds.id,
    })
    .from(feeds)

    .where(eq(feeds.url, url))
    .execute();

  return result;
}

export async function following(userId: string) {
  const result = await db
    .select({
      feedname: feeds.name,
      username: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .where(eq(feedFollows.userId, userId))
    .execute();

  return result;
}
