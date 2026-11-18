import { app, BrowserWindow } from "electron";
import { registerItemControls } from "./domain/items/item.controls";
import { runConditionalFactory } from "@db/factories/run-factories";
// import { startWebSocketServer, stopWebSocketServer } from "@server/websocket/client";
import { startClientServer, stopClientServer } from "@server/http/client";
import { registerHardwareControls } from "./domain/hardware/hardware.controls";
import { initializeDatabase } from "@config/database";
import { Settings } from "./util/settings";
import { registerDomainControls } from "./domain";
// import { registerSchemeHandlers } from "@server/scheme/scheme";

export async function executeBootstrapPipeline(mainWindow: BrowserWindow): Promise<void> {
  console.log("initializing settings...");
  await Settings.initialize();

  console.log("initializing database...");
  await initializeDatabase();

  console.log("registering controls...");
  await registerDomainControls(mainWindow);

  // registerSchemeHandlers();

  if (!app.isPackaged) {
    console.log("running factories...");
    await runConditionalFactory();
  }

  // Starts websocket for client
  // await startWebSocketServer(mainWindow);
  if (app.isPackaged) {
    // Starts https server for client browser
    // await startClientServer();
  }

  console.log("✅ Bootstrap complete");
}

export function teardown(): void {
  // Closes servers
  // stopWebSocketServer();
  // stopClientServer();
}
