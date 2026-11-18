import { app, BrowserWindow, dialog, protocol } from "electron";
import path from "path";
import { executeBootstrapPipeline, teardown } from "./bootstrap";
import { registerSchemeHandlers } from "@server/scheme/scheme";
// import { bootstrap, teardown } from "./bootstrap";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
  app.quit();
  process.exit(0);
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "micropos",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 768,
    show: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    // mainWindow.maximize();
    mainWindow.show();
  });

  if (!app.isPackaged) {
    void mainWindow.loadURL("http://localhost:4200");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.setMenuBarVisibility(false);
    void mainWindow.loadFile(path.join(process.resourcesPath, "electron-ui/browser/index.html"));
  }

  return mainWindow;
}

app.on("ready", async () => {
  registerSchemeHandlers();
  const mainWindow = createWindow();
  await executeBootstrapPipeline(mainWindow).catch((err) => {
    dialog.showErrorBox("Startup Failed", String(err));
    app.quit();
  });
});

app.on("window-all-closed", () => {
  teardown();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
