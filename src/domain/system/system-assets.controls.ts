import { logger } from "@config/logger";
import { MainIPC } from "../../util/ipc-helpers";
import { AssetResult } from "@shared/src";

export async function initializeSystemAssetsControls() {
  MainIPC.handleQuery("system-assets:getMicroposLogo", async () => {
    try {
      // This could query a database or just return a hardcoded filename
      // depending on your asset management strategy
      return {
        status: 200,
        data: {
          filename: "micropos_black_base.png",
          url: "micropos://asset/images/logo/micropos_black_base.png",
        } satisfies AssetResult,
      };
    } catch (err) {
      logger.error("Failed to get MicroPOS logo:", err);
      return { status: 500, error: String(err) };
    }
  });
}
