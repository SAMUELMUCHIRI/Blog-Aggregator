import os from "os";
import { setUser, readConfig } from "./config.js";

function main() {
  setUser("Lane");
  console.log(readConfig());
}

main();
