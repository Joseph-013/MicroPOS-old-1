// src/domain/system/store-config.controller.ts
import { BrowserWindow } from "electron";
import { MainIPC } from "../../util/ipc-helpers";
import { Settings } from "../../util/settings";
import { logger } from "@config/logger";
import { deleteLogo, getLogo, uploadLogo } from "./store-assets.controls";
import { LogoUploadPayload, StoreConfig } from "@shared/src";

const SETTINGS_KEY_STORE_CONFIG = "system_store_config";

const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: "",
  storeAddress: "",
};

export async function registerSystemConfigHandlers(mainWindow: BrowserWindow): Promise<void> {
  // ── Store Config ──────────────────────────────────────────────────────────

  MainIPC.handleQuery("store-config:getStoreConfig", () => {
    const config = Settings.get<StoreConfig>(SETTINGS_KEY_STORE_CONFIG) ?? DEFAULT_STORE_CONFIG;
    return { status: 200, data: config };
  });

  MainIPC.handleQuery("store-config:updateStoreConfig", async (_event, payload: Partial<StoreConfig>) => {
    try {
      const current = Settings.get<StoreConfig>(SETTINGS_KEY_STORE_CONFIG) ?? DEFAULT_STORE_CONFIG;
      const updated: StoreConfig = { ...current, ...payload };
      await Settings.set(SETTINGS_KEY_STORE_CONFIG, updated);

      MainIPC.sendToWindow(mainWindow, "store-config:onStoreConfigChange", updated);
      logger.info("Store config updated");
      return { status: 200, data: updated };
    } catch (err) {
      logger.error("Failed to update store config:", err);
      return { status: 500, error: String(err) };
    }
  });

  // ── Store Logo ────────────────────────────────────────────────────────────

  MainIPC.handleQuery("store-assets:uploadLogo", async (_event, payload: LogoUploadPayload) => {
    try {
      const filename = await uploadLogo(payload);
      logger.info(`Store logo uploaded: ${filename}`);
      MainIPC.sendToWindow(mainWindow, "store-assets:onLogoChange", {
        url: `micropos://user/logo/${filename}`,
      });
      return { status: 200, data: { filename } };
    } catch (err) {
      logger.error("Failed to upload logo:", err);
      return { status: 500, error: String(err) };
    }
  });

  MainIPC.handleQuery("store-assets:getLogo", async () => {
    try {
      const result = await getLogo();
      if (!result) return { status: 404, error: "No logo found" };
      return { status: 200, data: result };
    } catch (err) {
      logger.error("Failed to get logo:", err);
      return { status: 500, error: String(err) };
    }
  });

  MainIPC.handleQuery("store-assets:deleteLogo", async () => {
    try {
      await deleteLogo();
      MainIPC.sendToWindow(mainWindow, "store-assets:onLogoChange", { url: null });
      return { status: 200, data: undefined };
    } catch (err) {
      logger.error("Failed to delete logo:", err);
      return { status: 500, error: String(err) };
    }
  });
}
