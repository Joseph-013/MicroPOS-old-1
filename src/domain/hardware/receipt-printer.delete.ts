// import { BrowserWindow } from "electron";

// export function initializeReceiptPrinterHandlers(mainWindow: BrowserWindow): void {
// MainIPC.handleQuery("printerConnect", async (_event, data) => {
//   try {
//     if (activePrinter) {
//       await activePrinter.device.releaseInterface(activePrinter.interfaceNumber);
//       await activePrinter.device.close();
//       activePrinter = null;
//     }
//     activePrinter = await openPrinterDevice(data.device);
//     logger.info(`Printer connected: ${data.device.productName}`);
//     return { status: 200, data: undefined };
//   } catch (err) {
//     logger.error("Failed to connect to printer:", err);
//     return { status: 500, error: "Failed to connect to device." };
//   }
// });
// MainIPC.handleQuery("printerDisconnect", async () => {
//   try {
//     if (activePrinter) {
//       await activePrinter.device.releaseInterface(activePrinter.interfaceNumber);
//       await activePrinter.device.close();
//       activePrinter = null;
//     }
//     return { status: 200, data: undefined };
//   } catch (err) {
//     logger.error("Failed to disconnect printer:", err);
//     return { status: 500, error: String(err) };
//   }
// });
// MainIPC.handleQuery("printerGetPaperWidth", () => {
//   return { status: 200, data: paperWidth };
// });
// MainIPC.handleQuery("printerSetPaperWidth", (_event, width) => {
//   paperWidth = width;
//   logger.info(`Paper width set to ${width}mm`);
//   return { status: 200, data: undefined };
// });
// MainIPC.handleQuery("printerPrintReceipt", async (_event, data) => {
//   if (!activePrinter) {
//     return { status: 400, error: "No printer connected" };
//   }
//   try {
//     const bytes = await buildReceiptBytes(data.payload);
//     await writeToDevice(activePrinter, bytes);
//     logger.info("Receipt printed successfully");
//     return { status: 200, data: undefined };
//   } catch (err) {
//     logger.error("Print failed:", err);
//     return { status: 500, error: String(err) };
//   }
// });
// }

// interface ActivePrinter {
//   device: UsbDeviceType;
//   interfaceNumber: number;
//   endpointNumber: number;
//   packetSize: number;
// }

// let activePrinter: ActivePrinter | null = null;
// let paperWidth = 58;

// async function writeToDevice(printer: ActivePrinter, data: Uint8Array): Promise<void> {
//   const { device, endpointNumber, packetSize } = printer;

//   for (let i = 0; i < data.length; i += packetSize) {
//     const chunk = data.slice(i, i + packetSize);
//     await device.nativeTransferOut(endpointNumber, 5000, chunk);
//   }
// }

// function padEndBytes(str: string, targetLength: number): string {
//   const byteLen = new TextEncoder().encode(str).length;
//   const padCount = targetLength - byteLen;
//   return str + " ".repeat(padCount > 0 ? padCount : 0);
// }

// function padStartBytes(str: string, targetLength: number): string {
//   const byteLen = new TextEncoder().encode(str).length;
//   const padCount = targetLength - byteLen;
//   return " ".repeat(padCount > 0 ? padCount : 0) + str;
// }

// async function buildReceiptBytes(payload: ReceiptPayload): Promise<Uint8Array> {
//   const width = mmToChars(paperWidth);

//   const qtyColumnWidth = Math.floor(width * 0.26);
//   const totalColumnWidth = Math.floor(width * 0.26);

//   const marginBetweenColumns = 1;
//   const totalMargins = marginBetweenColumns * 2;

//   const itemColumnWidth = width - qtyColumnWidth - totalColumnWidth - totalMargins;

//   const encoder = new ReceiptPrinterEncoder({
//     language: "esc-pos",
//     width,
//     codepage: "windows1252",
//     feedBeforeCut: 2,
//     imageMode: "column",
//   });

//   console.log(ReceiptPrinterEncoder.codepageMappings);

//   const divider = (symbol?: string) => (symbol ?? "-").repeat(width);

//   const storeLogoPath = path.join(__dirname, "assets", "images", "logo", "store_logo_black.png");
//   const storeLogoCanvas = await prepareCanvasForPrinter(storeLogoPath);

//   const micropos = path.join(__dirname, "assets", "images", "logo", "black.png");
//   const microposLogoCanvas = await prepareCanvasForPrinter(micropos, { width: 144 });

//   const total = payload.entries.reduce((sum, i) => sum + i.price * i.quantity, 0);

//   let enc = encoder
//     .initialize()
//     .newline()
//     .align("center")
//     .line(" ")
//     .image(storeLogoCanvas, storeLogoCanvas.width, storeLogoCanvas.height, "threshold")
//     .newline()
//     .line("Lizardo St. Brygy. Kayhuvukan")
//     .newline()
//     .line("Basco, Batanes")
//     .newline()
//     .align("left")
//     .line(`Date: ${new Date(payload.datetimeISO).toLocaleString()}`)
//     .line(divider("*"))
//     .table(
//       [
//         {
//           width: itemColumnWidth,
//           marginRight: marginBetweenColumns,
//           align: "left",
//         },
//         {
//           width: qtyColumnWidth,
//           marginRight: marginBetweenColumns,
//           align: "left",
//         },
//         {
//           width: totalColumnWidth,
//           align: "right",
//         },
//       ],
//       payload.entries.map((trx) => [
//         `${trx.name}\n`,
//         `@${trx.price}\nx${trx.quantity}`,
//         `${currency(trx.quantity * trx.price)}\n`,
//       ]),
//     )
//     .line(divider())
//     .align("right")
//     .bold(true)
//     .line(`GRAND TOTAL: ${currency(total)}`)
//     .bold(false)
//     .line(divider("*"))
//     .newline()
//     .align("center")
//     .newline()
//     .line("This is an order slip. Return and ask for your Official Receipt or Sales Invoice. Thank you.")
//     .newline()
//     .italic(true)
//     .line("THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX")
//     .italic(false)
//     .newline()
//     .line("Powered by:")
//     .image(microposLogoCanvas, microposLogoCanvas.width, microposLogoCanvas.height, "threshold")
//     .newline()
//     .newline()
//     .qrcode(payload.decodedTransactionQR, 1, 8, "h")
//     .cut();

//   return enc.encode();
// }

// function mmToPixelWidth(): number {
//   return paperWidth === 80 ? 576 : 384;
// }

// interface PrinterCanvasOptions {
//   width?: number;
//   height?: number;
// }

// async function prepareCanvasForPrinter(imagePath: string, options: PrinterCanvasOptions = {}) {
//   const image = await loadImage(imagePath);
//   const aspectRatio = image.height / image.width;

//   let targetPixelWidth: number;
//   if (options.width !== undefined) {
//     targetPixelWidth = Math.round(options.width / 8) * 8;
//   } else {
//     targetPixelWidth = mmToPixelWidth();
//     targetPixelWidth = Math.round(targetPixelWidth / 8) * 8;
//   }
//   targetPixelWidth = Math.max(8, targetPixelWidth);

//   let targetPixelHeight: number;
//   if (options.height !== undefined) {
//     targetPixelHeight = Math.round(options.height / 8) * 8;
//   } else {
//     targetPixelHeight = Math.round(targetPixelWidth * aspectRatio);
//     targetPixelHeight = Math.round(targetPixelHeight / 8) * 8;
//   }
//   targetPixelHeight = Math.max(8, targetPixelHeight);

//   const canvas = createCanvas(targetPixelWidth, targetPixelHeight);
//   const ctx = canvas.getContext("2d");

//   ctx.fillStyle = "#ffffff";
//   ctx.fillRect(0, 0, targetPixelWidth, targetPixelHeight);

//   ctx.drawImage(image, 0, 0, targetPixelWidth, targetPixelHeight);

//   return canvas;
// }
