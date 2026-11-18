import { app, net, protocol } from "electron";
import fs from "node:fs";
import path from "path";

export function registerSchemeHandlers() {
  console.log("\n\nRegistering scheme handlers");
  // protocol.handle("micropos", (request) => {
  //   const url = new URL(request.url);
  //   // hostname = "assets", pathname = "/logo/store_logo.png"
  //   const relativePath = path.join(url.hostname, url.pathname.replace(/^\//, ""));
  //   const absolutePath = path.join(app.getPath("userData"), relativePath);

  //   if (!fs.existsSync(absolutePath)) {
  //     console.warn(`Asset not found on disk: ${absolutePath}`);
  //     return new Response("Not found", { status: 404 });
  //   }

  //   return net.fetch(`file://${absolutePath}`);
  // });

  protocol.handle("micropos", (request) => {
    console.log("\n\nProtocol handler called for:", request.url); // Debug log

    const url = new URL(request.url);
    const scope = url.hostname;
    const relativePath = url.pathname;

    let absolutePath = "";

    if (scope === "asset") {
      const assetsPath = !app.isPackaged
        ? path.join(app.getAppPath(), "assets", relativePath)
        : path.join(process.resourcesPath, "assets", relativePath);

      absolutePath = assetsPath;
    } else if (scope === "user") {
      absolutePath = path.join(app.getPath("userData"), "user", relativePath);
    } else {
      return new Response("Invalid scope", { status: 400 });
    }

    if (!fs.existsSync(absolutePath)) {
      console.warn(`File not found: ${absolutePath}`);
      return new Response("Not found", { status: 404 });
    }

    return net.fetch(`file://${absolutePath}`);
  });
}
