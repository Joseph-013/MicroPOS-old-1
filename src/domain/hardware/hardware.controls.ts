import { BrowserWindow } from "electron";
import { initializeBarcodeScannerHandler } from "./barcode-scanner";
import { initializeHIDDeviceManager } from "./hid-device-manager";
import { initializeUSBDeviceManager } from "./usb-device-manager";
import { initializeReceiptPrinterHandlers } from "./receipt-printer/receipt-printer.controls";

export async function registerHardwareControls(mainWindow: BrowserWindow) {
  initializeHIDDeviceManager(mainWindow);
  initializeBarcodeScannerHandler(mainWindow);
  await initializeUSBDeviceManager(mainWindow);
  await initializeReceiptPrinterHandlers(mainWindow);
}
