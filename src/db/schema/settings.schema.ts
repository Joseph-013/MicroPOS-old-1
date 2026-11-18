import { text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  key: text().primaryKey(),
  value: text({ mode: "json" }),
  updatedAt: text(),
});
