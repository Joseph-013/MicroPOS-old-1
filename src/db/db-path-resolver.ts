import path from "node:path";
import { app } from "electron";

export function resolveDatabasePath(): string {
  return app.isPackaged
    ? path.join(app.getPath("userData"), "micropos.db")
    : path.join(app.getAppPath(), "local-data", "micropos.db");
}
