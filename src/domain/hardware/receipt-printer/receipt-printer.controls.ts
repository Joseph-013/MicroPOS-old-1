import { BrowserWindow } from "electron";
import { MainIPC } from "../../../util/ipc-helpers";
import { logger } from "@config/logger";
import { ReceiptConfig, UsbDeviceInfo } from "@shared/src";
import { Settings } from "../../../util/settings";
import { PrinterDevice, openPrinterDevice } from "./printer.device";
import { USBDeviceManager } from "../usb-device-manager";
import { Observable, Subject } from "rxjs";

export const SETTINGS_KEY_DEVICE = "receipt_printer_saved_device";
export const SETTINGS_KEY_CONFIG = "receipt_printer_saved_config";
export const INITIAL_CONFIG: ReceiptConfig = {
  paperWidthMm: 58,
};

let activePrinter: PrinterDevice | null = null;
let activeInterfaceNumber: number | null = null;
let activeDeviceInfo: UsbDeviceInfo | null = null;

// Internal Subjects for event tracking
const deviceConnectSubject = new Subject<UsbDeviceInfo>();
const deviceDisconnectSubject = new Subject<void>();

export const onDeviceConnect$: Observable<UsbDeviceInfo> = deviceConnectSubject.asObservable();
export const onDeviceDisconnect$: Observable<void> = deviceDisconnectSubject.asObservable();

/**
 * Gathers the current definitive state of the printer subsystem.
 */
function getPrinterState() {
  const connected = activePrinter !== null && activeDeviceInfo !== null;
  console.log("Printer state: ", {
    connected,
    device: activeDeviceInfo ?? Settings.get<UsbDeviceInfo>(SETTINGS_KEY_DEVICE) ?? null,
    config: Settings.get<ReceiptConfig>(SETTINGS_KEY_CONFIG) ?? INITIAL_CONFIG,
  });
  return {
    connected,
    device: activeDeviceInfo ?? Settings.get<UsbDeviceInfo>(SETTINGS_KEY_DEVICE) ?? null,
    config: Settings.get<ReceiptConfig>(SETTINGS_KEY_CONFIG) ?? INITIAL_CONFIG,
  };
}

/**
 * Broadcasts the unified state object to the renderer window.
 */
function broadcastState(mainWindow: BrowserWindow): void {
  if (mainWindow.isDestroyed()) return;
  MainIPC.sendToWindow(mainWindow, "receipt-printer:stateChanged", getPrinterState());
}

export async function initializeReceiptPrinterHandlers(mainWindow: BrowserWindow): Promise<void> {
  // Handle reactive connection events
  onDeviceConnect$.subscribe((device) => {
    logger.info(`[Event] Printer Connected: ${device.label}`);
    broadcastState(mainWindow);
  });

  // Handle reactive disconnection events
  onDeviceDisconnect$.subscribe(() => {
    logger.warn(`[Event] Printer Disconnected`);
    broadcastState(mainWindow);
  });

  // Monitor USB bus via USBDeviceManager stream to catch unexpected unplugs
  USBDeviceManager.devices$.subscribe(async (devices) => {
    // 1. Existing unexpected unplug logic
    if (activeDeviceInfo) {
      const stillConnected = devices.some((d) => d.deviceKey === activeDeviceInfo?.deviceKey);
      if (!stillConnected) {
        await disconnectPrinter();
        deviceDisconnectSubject.next();
      }
    }
    // 2. NEW: If printer is currently offline, check if our saved printer just got plugged in!
    else if (!activePrinter && Settings.has(SETTINGS_KEY_DEVICE)) {
      const savedDevice = Settings.get<UsbDeviceInfo>(SETTINGS_KEY_DEVICE);
      const isOurDevicePluggedIn = devices.some((d) => d.deviceKey === savedDevice?.deviceKey);

      if (isOurDevicePluggedIn) {
        logger.info("Saved receipt printer detected on USB bus. Attempting auto-connect...");
        await attemptAutoConnect(mainWindow);
      }
    }
  });

  MainIPC.handleQuery("receipt-printer:connect", async (_event, data: { usbDeviceInfo: UsbDeviceInfo }) => {
    try {
      await disconnectPrinter();

      const opened = await openPrinterDevice(data.usbDeviceInfo);
      activeInterfaceNumber = opened.interfaceNumber;
      activePrinter = new PrinterDevice(opened.device, opened.endpointNumber, opened.packetSize);
      activeDeviceInfo = data.usbDeviceInfo;

      await Settings.set(SETTINGS_KEY_DEVICE, data.usbDeviceInfo);

      deviceConnectSubject.next(data.usbDeviceInfo);
      return { status: 200, message: "Printer connected successfully" };
    } catch (err) {
      logger.error(`Printer connect failed: ${err}`);
      await disconnectPrinter();
      return { status: 500, error: "Printer connection failed." };
    }
  });

  MainIPC.handleQuery("receipt-printer:update-config", async (_event, newConfig: Partial<ReceiptConfig>) => {
    try {
      const current = Settings.get<ReceiptConfig>(SETTINGS_KEY_CONFIG) ?? INITIAL_CONFIG;
      const updated: ReceiptConfig = { ...current, ...newConfig };

      await Settings.set(SETTINGS_KEY_CONFIG, updated);
      broadcastState(mainWindow);

      return { status: 200, message: "Configuration updated successfully" };
    } catch (err) {
      logger.error(`Config update failed: ${err}`);
      return { status: 500, error: String(err) };
    }
  });

  MainIPC.handleQuery("receipt-printer:status", async () => {
    return getPrinterState();
  });

  MainIPC.handleQuery("receipt-printer:disconnect", async () => {
    await disconnectPrinter();
    deviceDisconnectSubject.next();
    return { status: 200, message: "Printer disconnected" };
  });

  MainIPC.handleQuery("receipt-printer:print", async (_event, data: Uint8Array<ArrayBufferLike>) => {
    try {
      const rawBytes = new Uint8Array(data);
      await attemptPrintWithRetry(rawBytes);
      return { status: 200, data: "Print job sent successfully." };
    } catch (err) {
      logger.error(`Raw print transmission failed: ${err}`);
      return { status: 500, error: String(err) };
    }
  });

  await attemptAutoConnect(mainWindow);
}

async function disconnectPrinter(): Promise<void> {
  if (activePrinter && activeInterfaceNumber !== null) {
    try {
      await activePrinter.release(activeInterfaceNumber);
    } catch {}
  }
  const wasConnected = activePrinter !== null;
  activePrinter = null;
  activeInterfaceNumber = null;
  activeDeviceInfo = null;

  if (wasConnected) {
    deviceDisconnectSubject.next();
  }
}

async function ensurePrinterConnected(): Promise<boolean> {
  if (activePrinter) return true;
  if (!Settings.has(SETTINGS_KEY_DEVICE)) return false;

  try {
    const savedDevice = Settings.get<UsbDeviceInfo>(SETTINGS_KEY_DEVICE);
    if (!savedDevice) return false;

    const availableDevices = USBDeviceManager.getConnectedDevices();
    const isPresent = availableDevices.some((d) => d.deviceKey === savedDevice.deviceKey);
    if (!isPresent) return false;

    const opened = await openPrinterDevice(savedDevice);
    activeInterfaceNumber = opened.interfaceNumber;
    activePrinter = new PrinterDevice(opened.device, opened.endpointNumber, opened.packetSize);
    activeDeviceInfo = savedDevice;

    deviceConnectSubject.next(savedDevice);
    return true;
  } catch (err) {
    logger.error(`Recovery connect failed: ${err}`);
    await disconnectPrinter();
    return false;
  }
}

async function attemptAutoConnect(mainWindow: BrowserWindow): Promise<void> {
  if (!Settings.has(SETTINGS_KEY_DEVICE)) return;

  console.log("Attempting receipt printer device auto-connect...");

  try {
    const reconnected = await ensurePrinterConnected();
    if (!reconnected) throw new Error("Saved device profile missing or failed.");

    logger.info(`Auto-connection successful: ${activeDeviceInfo?.label}`);
    broadcastState(mainWindow);
  } catch (err) {
    logger.warn(`Startup auto-connect failed: ${err}`);
    await disconnectPrinter();

    if (!mainWindow.isDestroyed()) {
      MainIPC.sendToWindow(mainWindow, "receipt-printer:error", `Auto-connect failed: ${err}`);
    }
  }
}

async function attemptPrintWithRetry(bytes: Uint8Array): Promise<void> {
  async function tryPrint(): Promise<void> {
    if (!activePrinter) throw new Error("No active printer connection");
    await activePrinter.write(bytes);
  }

  try {
    await tryPrint();
  } catch (printErr) {
    const msg = String(printErr);
    if (msg.includes("Disconnected") || msg.includes("transferOut") || msg.includes("not found")) {
      logger.warn("Connection lost mid-print. Attempting hot reconnect...");
      await disconnectPrinter();

      const reconnected = await ensurePrinterConnected();
      if (!reconnected) throw new Error("Hot reconnect failed — no saved device.");

      await tryPrint();
    } else {
      throw printErr;
    }
  }
}
