import { BrowserWindow } from "electron";
import HID, { Device } from "node-hid";
import { MainIPC } from "../../util/ipc-helpers";

let activeHIDDevicesCache: Device[] = [];
let previousDevicePaths = new Set<string>();

export function initializeHIDDeviceManager(mainWindow: BrowserWindow): void {
  activeHIDDevicesCache = dedupeHidDevices(HID.devices());

  startHidWatcher(mainWindow);

  MainIPC.handleQuery("getHIDDevices", () => {
    return { status: 200, data: activeHIDDevicesCache };
  });
}

function startHidWatcher(mainWindow: BrowserWindow, intervalMs = 2000): void {
  previousDevicePaths = new Set(HID.devices().map((d) => d.path ?? ""));

  setInterval(() => {
    const current = HID.devices();
    const currentPaths = new Set(current.map((d) => d.path ?? ""));

    const changed =
      currentPaths.size !== previousDevicePaths.size || [...currentPaths].some((p) => !previousDevicePaths.has(p));

    if (changed) {
      previousDevicePaths = currentPaths;
      activeHIDDevicesCache = current;
      MainIPC.sendToWindow(mainWindow, "hidDeviceListUpdated", activeHIDDevicesCache);
    }
  }, intervalMs);
}

function dedupeHidDevices(devices: HID.Device[]): HID.Device[] {
  const seen = new Set<string>();
  return devices.filter((d) => {
    const key = `${d.vendorId}:${d.productId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
