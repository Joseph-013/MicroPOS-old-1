import { ApiResponse } from "@shared/src";
import { MainIPC } from "../../util/ipc-helpers";
import { Settings } from "../../util/settings";
import { logger } from "@config/logger";

export async function registerSettingsControls() {
  MainIPC.handleQuery("settings:get", async (event, key: string) => {
    try {
      const value = Settings.get(key);
      return { status: 200, data: value };
    } catch (error) {
      logger.error(`Failed to get setting "${key}":`, error);
      return { status: 500, error: "Failed to get settings value." };
    }
  });

  MainIPC.handleQuery("settings:set", async (event, params: { key: string; value: unknown }) => {
    const { key, value } = params;

    try {
      await Settings.set(key, value);
      return { status: 200, data: undefined };
    } catch (error) {
      logger.error(`Failed to set setting "${key}":`, error);
      return { status: 500, error: "Failed to set settings value." };
    }
  });

  MainIPC.handleQuery("settings:has", async (event, key: string) => {
    try {
      const exists = Settings.has(key);
      return { status: 200, data: exists };
    } catch (error) {
      logger.error(`Failed to check setting "${key}":`, error);
      return { status: 500, error: "Failed to check settings." };
    }
  });

  MainIPC.handleQuery("settings:remove", async (event, key: string) => {
    try {
      await Settings.remove(key);
      return { status: 200, data: undefined };
    } catch (error) {
      logger.error(`Failed to remove setting "${key}":`, error);
      return { status: 500, error: "Failed to remove setting." };
    }
  });
}
