import ws, { WebSocket } from "ws";
import { BrowserWindow } from "electron";
import { logger } from "../../config/logger";
import { db } from "../../config/database";
import { createServer } from "https";
import { readFileSync } from "fs";
import path from "path";
import { WsMessage } from "@shared/src/models";
import { ApiResponse } from "@shared/src";
import { generateCerts } from "../../domain/system/system.controls";

const WebSocketServer = ws.Server;

let wss: ws.Server | null = null;

export async function startWebSocketServer(win: BrowserWindow): Promise<void> {
  try {
    const setting = await db.selectFrom("settings").select("value").where("key", "=", "ws_port").executeTakeFirst();

    const port = parseInt(setting?.value ?? "3434", 10);

    const { key, cert } = await generateCerts();

    const httpsServer = createServer({ key, cert });

    // assign to module-level wss, not a new const
    wss = new WebSocketServer({ server: httpsServer });

    wss.on("connection", (ws: WebSocket) => {
      logger.info("WebSocket: client connected");

      ws.on("message", (raw) => {
        try {
          const message: WsMessage = JSON.parse(raw.toString());
          handleMessage(ws, win, message);
        } catch (error) {
          logger.error("WebSocket: failed to parse message", error);
          sendResponse(ws, { status: 400, error: "Invalid message format" });
        }
      });

      ws.on("close", () => {
        logger.info("WebSocket: client disconnected");
      });

      ws.on("error", (error) => {
        logger.error("WebSocket: client error", error);
      });
    });

    wss.on("error", (error) => {
      logger.error("WebSocket server error", error);
      console.error("WebSocket server error", error);
    });

    httpsServer.on("error", (error) => {
      logger.error("HTTPS server error", error);
      console.error("HTTPS server error", error);
    });

    httpsServer.listen(port, "0.0.0.0", () => {
      logger.info(`WebSocket server listening on wss://0.0.0.0:${port}`);
      console.log(`WebSocket server listening on wss://0.0.0.0:${port}`);
    });
  } catch (err) {
    logger.error("WebSocket: failed to start", err);
    console.error("WebSocket: failed to start", err);
  }
}

export function stopWebSocketServer(): void {
  wss?.close(() => {
    logger.info("WebSocket server closed");
  });
  wss = null;
}

function handleMessage(ws: WebSocket, win: BrowserWindow, message: WsMessage): void {
  console.log("received");
  switch (message.type) {
    case "barcode":
      win.webContents.send("barcode:scanned", message.payload);
      sendResponse(ws, { status: 200, data: { received: true } });
      break;
    default:
      logger.warn(`WebSocket: unhandled message type "${message.type}"`);
      sendResponse(ws, { status: 400, error: `Unknown message type: ${message.type}` });
  }
}

function sendResponse(ws: WebSocket, response: ApiResponse): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(response));
  }
}
