// src/main/http/client.server.ts
import { createServer, Server } from "https";
import { existsSync, readFileSync } from "fs";
import serveStatic from "serve-static";
import path from "path";
import { app } from "electron";
import { logger } from "@config/logger";
import { generateCerts } from "../../domain/system/system.controls";

let server: Server | null = null;
let activePort: number | null = null;

export async function startClientServer(port = 4200): Promise<number> {
  const clientPath = app.isPackaged
    ? path.join(process.resourcesPath, "client/browser")
    : path.join(process.cwd(), "client/dist/client/browser");

  const serve = serveStatic(clientPath, { index: ["index.html"] });

  const { key, cert } = await generateCerts();

  return new Promise((resolve, reject) => {
    const tryListen = (attemptPort: number): void => {
      const httpsServer = createServer({ key, cert }, (req, res) => {
        serve(req, res, () => {
          const indexPath = path.join(clientPath, "index.html");

          if (!existsSync(indexPath)) {
            res.writeHead(503, { "Content-Type": "text/plain" });
            res.end("Client app not built yet.");
            return;
          }

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(readFileSync(indexPath));
        });
      });

      httpsServer.listen(attemptPort, "0.0.0.0");

      httpsServer.on("listening", () => {
        server = httpsServer;
        activePort = attemptPort;
        logger.info(`Client server listening on https://0.0.0.0:${attemptPort}`);
        console.log(`Client server listening on https://0.0.0.0:${attemptPort}`);
        resolve(attemptPort);
      });

      httpsServer.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          logger.warn(`Client server port ${attemptPort} in use, trying ${attemptPort + 100}`);
          console.warn(`Client server port ${attemptPort} in use, trying ${attemptPort + 100}`);
          httpsServer.close();
          tryListen(attemptPort + 100);
        } else {
          logger.error("Client server error", err);
          console.error("Client server error", err);
          reject(err);
        }
      });
    };

    tryListen(port);
  });
}

export function getActiveClientPort(): number | null {
  return activePort;
}

export function stopClientServer(): void {
  server?.close(() => {
    logger.info("Client server closed");
  });
  server = null;
  activePort = null;
}
