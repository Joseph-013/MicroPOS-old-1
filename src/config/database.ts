import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { resolveDatabasePath } from "../db/db-path-resolver";
import * as schema from "../db/schema/index"; // Import your barreled schemas
import { logger } from "./logger";
import { app } from "electron";

const dbPath = resolveDatabasePath();

console.log("DATABASE PATH:", dbPath);

const databaseDirectory = path.dirname(dbPath);

// Ensure local directories exist for the cashier's app state file
if (!fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, {
    recursive: true,
  });
}

const nativeDb = new Database(dbPath);

nativeDb.pragma("foreign_keys = ON");
// High-throughput performance pragmas
nativeDb.pragma("journal_mode = WAL");
nativeDb.pragma("foreign_keys = ON"); // Explicitly enforce foreign key constraints for SQLite

// Initialize the fully typed Drizzle Client instance
export const db = drizzle(nativeDb, { schema, casing: "snake_case" });

/**
 * Automatically applies SQL migrations on Main Process start
 */
export async function initializeDatabase() {
  try {
    const migrationsPath = app.isPackaged
      ? path.join(process.resourcesPath, "migrations")
      : path.join(app.getAppPath(), "src/db/migrations");

    console.log("Migrations path:", migrationsPath);
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Database schema successfully synced.");
  } catch (error) {
    console.error("Migration failed:", error);
    logger.error("database.initializeDatabase() error:", error);
    throw error;
  }
}
