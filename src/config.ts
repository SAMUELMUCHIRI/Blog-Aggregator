import type { Config } from "../config";
import fs from "fs";

import os from "os";

const outputFilePath: string = os.homedir() + "/.gatorconfig.json";

function isConfig(value: any): value is Config {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.dbUrl === "string"
  );
}

export function setUser(user_name: string) {
  const previousConfig = readConfig();
  if (!previousConfig) {
    throw new Error("Config does not exist");
  }
  previousConfig.currentUserName = user_name;
  fs.writeFileSync(outputFilePath, JSON.stringify(previousConfig, null, 4));
  console.log(`User set successfully : config at ${outputFilePath}`);
}
export function readConfig(): Config | undefined {
  try {
    const raw = fs.readFileSync(outputFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return isConfig(parsed) ? parsed : undefined;
  } catch (error) {
    return undefined;
  }
}
