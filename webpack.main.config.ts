import type { Configuration } from "webpack";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";
import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/index.ts",
  externals: {
    "better-sqlite3": "commonjs better-sqlite3",
    "node-hid": "commonjs node-hid",
    ws: "commonjs ws",
    "@point-of-sale/receipt-printer-encoder": "commonjs @point-of-sale/receipt-printer-encoder",
    sharp: "commonjs sharp",
    usb: "commonjs usb",
  },
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, "assets"), to: "assets" }],
    }),
  ],
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
    alias: {
      "@config": path.resolve(__dirname, "src/config"),
      "@db": path.resolve(__dirname, "src/db"),
      "@server": path.resolve(__dirname, "src/server"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
};
