import { defineConfig } from "drizzle-kit";

const isDrizzleCli = process.argv.some((arg) => arg.includes("drizzle-kit"));

let dbUrl: string;

if (isDrizzleCli) {
  dbUrl = "micropos-dev.db";
} else {
  const { resolveDatabasePath } = require("./src/db/db-path-resolver");
  dbUrl = resolveDatabasePath();
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  casing: "snake_case",
  dbCredentials: {
    url: dbUrl,
  },
});
