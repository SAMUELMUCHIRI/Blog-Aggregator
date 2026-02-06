import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Config } from "../../../config";

import * as schema from "./schema";
import { readConfig } from "../../config";

export function tryreadConfig(): Config {
  const config = readConfig();
  if (!config) {
    throw new Error("Config not found");
  }
  return config;
}

const config = tryreadConfig();

const conn = postgres(config.dbUrl);
export const db = drizzle(conn, { schema });
