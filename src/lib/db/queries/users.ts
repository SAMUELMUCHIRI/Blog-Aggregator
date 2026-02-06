import { db } from "..";
import { users } from "../schema";
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
