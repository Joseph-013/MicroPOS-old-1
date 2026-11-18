import { db } from "@config/database";
import { settings } from "@db/schema/settings.schema";
import { nowISO } from "./query-helpers";
import { eq } from "drizzle-orm";
import { INITIAL_CONFIG, SETTINGS_KEY_CONFIG } from "../domain/hardware/receipt-printer/receipt-printer.controls";

export class Settings {
  private static cache: Map<string, unknown> = new Map();

  public static async initialize(): Promise<void> {
    try {
      const defaultSettings = [
        { key: "ws_port", value: "3434" },
        {
          key: SETTINGS_KEY_CONFIG,
          value: INITIAL_CONFIG,
        },
      ];

      console.log("⚙️ Ensuring system default settings exist...");

      await db.insert(settings).values(defaultSettings).onConflictDoNothing({ target: settings.key });

      const allSettings = await db.select().from(settings);
      for (const row of allSettings) {
        this.cache.set(row.key, row.value);
      }

      console.log(`⚙️ Cached ${this.cache.size} system settings successfully.`);
    } catch (error) {
      console.log(error);
    }
  }

  public static get<T = string>(key: string): T | null | undefined {
    const value = this.cache.get(key);
    // if (value === undefined) {
    //   throw new Error(`System configuration key "${key}" was not found and has no fallback.`);
    // }
    console.log("Settings get: ", key);
    return value as T;
  }

  public static async set(key: string, value: unknown): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value, updatedAt: nowISO() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: nowISO() },
      });
    console.log(`Settings set: ${key} to:`, value);
    this.cache.set(key, value);
  }

  public static has(key: string): boolean {
    return this.cache.has(key);
  }

  public static async remove(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
    this.cache.delete(key);
  }
}
