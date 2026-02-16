import { expect, test } from "vitest";
import { readConfig, setUser } from "./src/config.ts";
import { health } from "./src/lib/db/queries/users.ts";

test("Check Config Is Setup and Readable", () => {
  expect(readConfig()).toBeDefined();
});

test("Check Database URL Config Is Setup", () => {
  expect(readConfig()?.dbUrl).toBeDefined();
});

test("Check Connection to Database through Drizzle works", async () => {
  const result = await health();
  expect(result.health).toBe(1);
});
