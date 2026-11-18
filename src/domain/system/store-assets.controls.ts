// src/domain/system/store-assets.controller.ts
import { AssetResult, LogoUploadPayload } from "@shared/src";
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

const LOGO_DIR = path.join(app.getPath("userData"), "user", "logo");

function ensureLogoDir(): void {
  if (!fs.existsSync(LOGO_DIR)) {
    fs.mkdirSync(LOGO_DIR, { recursive: true });
  }
}

export async function uploadLogo(payload: LogoUploadPayload): Promise<string> {
  ensureLogoDir();

  // remove existing logo files before saving new one
  const existing = fs.readdirSync(LOGO_DIR).filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));
  existing.forEach((f) => fs.unlinkSync(path.join(LOGO_DIR, f)));

  const ext = payload.mimeType.split("/")[1] ?? "png";
  const filename = `store_logo.${ext}`;
  const filePath = path.join(LOGO_DIR, filename);

  const base64Data = payload.base64.replace(/^data:image\/\w+;base64,/, "");
  fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

  return filename;
}

export async function getLogo(): Promise<AssetResult | null> {
  ensureLogoDir();

  const files = fs.readdirSync(LOGO_DIR).filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));

  if (files.length === 0) return null;

  return {
    filename: files[0],
    url: `micropos://user/logo/${files[0]}`,
  };
}

export async function deleteLogo(): Promise<void> {
  ensureLogoDir();

  const files = fs.readdirSync(LOGO_DIR).filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));

  files.forEach((f) => fs.unlinkSync(path.join(LOGO_DIR, f)));
}
