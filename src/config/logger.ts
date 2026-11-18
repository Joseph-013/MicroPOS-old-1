import { app } from "electron";
import log from "electron-log";
import path from "path";

log.transports.file.resolvePathFn = () => {
  return app.isPackaged
    ? path.join(app.getPath("userData"), "logs", "main.log")
    : path.join(__dirname, "../../logs/main.log");
};

log.transports.file.maxSize = 5 * 1024 * 1024;

log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";

log.transports.console.level = "debug";

export const logger = log;
