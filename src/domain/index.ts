import { BrowserWindow } from "electron";
import { registerItemControls } from "./items/item.controls";
import { registerHardwareControls } from "./hardware/hardware.controls";
import { registerSalesOrderControls } from "./sales-orders/sales-orders.controls";
import { registerSettingsControls } from "./system/settings.controls";
import { registerSalesOrderItemControls } from "./sales-order-items/sales-order-item.controls";
import { registerSystemConfigHandlers } from "./system/store-config.controls";
import { initializeSystemAssetsControls } from "./system/system-assets.controls";

export async function registerDomainControls(mainWindow: BrowserWindow) {
  await registerItemControls(mainWindow);
  await registerSalesOrderControls(mainWindow);
  await registerSalesOrderItemControls();
  // // registerSystemControls(mainWindow);
  await registerSystemConfigHandlers(mainWindow);
  await initializeSystemAssetsControls();
  await registerHardwareControls(mainWindow);
  await registerSettingsControls();
}
