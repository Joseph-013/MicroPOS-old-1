import { BrowserWindow } from "electron";
import { usb } from "usb";
import { BehaviorSubject, Observable, distinctUntilChanged, from } from "rxjs";
import { MainIPC } from "../../util/ipc-helpers";
import { logger } from "@config/logger";
import { UsbDeviceInfo } from "@shared/src";

export type UsbDeviceType = Awaited<ReturnType<typeof usb.getDevices>>[number];

export interface SerializedUSBDevice {
  vendorId: number;
  productId: number;
  productName: string;
  serialNumber: string;
  manufacturerName: string;
}

function serializeUsbDevice(device: UsbDeviceType): UsbDeviceInfo {
  return {
    vendorId: device.vendorId,
    productId: device.productId,
    serialNumber: device.serialNumber ?? "",
    productName: device.productName ?? "Generic USB Device",
    manufacturerName: device.manufacturerName ?? "Unknown Manufacturer",
    deviceKey: `${device.vendorId}:${device.productId}:${device.serialNumber ?? ""}`,
    label: `${device.manufacturerName}: ${device.productName}`,
  };
}

function dedupeUSBDevices(devices: UsbDeviceType[]): UsbDeviceType[] {
  const seen = new Set<string>();
  return devices.filter((d) => {
    const key = `${d.vendorId}:${d.productId}:${d.serialNumber ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class USBDeviceManagerClass {
  private readonly devicesSubject = new BehaviorSubject<ReadonlyArray<UsbDeviceInfo>>([]);

  public readonly devices$ = this.devicesSubject
    .asObservable()
    .pipe(
      distinctUntilChanged(
        (prev, curr) =>
          prev.length === curr.length && prev.every((dev, index) => dev.deviceKey === curr[index].deviceKey),
      ),
    );

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    usb.addEventListener("connect", async () => {
      await this.refreshDevices();
    });

    usb.addEventListener("disconnect", async () => {
      await this.refreshDevices();
    });
  }

  async refreshDevices(): Promise<ReadonlyArray<UsbDeviceInfo>> {
    try {
      const current = await usb.getDevices();
      const serialized = dedupeUSBDevices(current).map(serializeUsbDevice);

      // Push new state into the RxJS stream
      this.devicesSubject.next(serialized);
      console.log("USB Devices updated via RxJS stream");

      return serialized;
    } catch (err) {
      logger.error("Failed to fetch USB devices:", err);
      return this.devicesSubject.getValue();
    }
  }

  getConnectedDevices(): ReadonlyArray<UsbDeviceInfo> {
    return this.devicesSubject.getValue();
  }
}

export const USBDeviceManager = new USBDeviceManagerClass();

export async function initializeUSBDeviceManager(mainWindow: BrowserWindow): Promise<void> {
  console.log("\x1b[36m[USB] initializeUSBDeviceManager called\x1b[0m");

  USBDeviceManager.devices$.subscribe((devices) => {
    if (!mainWindow.isDestroyed()) {
      MainIPC.sendToWindow(mainWindow, "usb-device-manager:onDeviceListUpdated", devices);
    }
  });

  await USBDeviceManager.refreshDevices();

  MainIPC.handleQuery("usb-device-manager:getUSBDevices", () => {
    return { status: 200, data: USBDeviceManager.getConnectedDevices() };
  });
}
