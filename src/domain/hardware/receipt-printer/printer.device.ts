import { usb } from "usb";
import { logger } from "@config/logger";
import { UsbDeviceInfo } from "@shared/src";
import { UsbDeviceType } from "../usb-device-manager";

interface PrinterInterface {
  interfaceNumber: number;
  endpointNumber: number;
  packetSize: number;
}

function findPrinterInterface(device: UsbDeviceType): PrinterInterface | null {
  for (const config of device.configurations) {
    for (const iface of config.interfaces) {
      const alt = iface.alternate;
      if (alt.interfaceClass === 7) {
        const outEndpoint = alt.endpoints.find((e: any) => e.direction === "out" && e.type === "bulk");
        if (outEndpoint) {
          return {
            interfaceNumber: iface.interfaceNumber,
            endpointNumber: outEndpoint.endpointNumber,
            packetSize: outEndpoint.packetSize,
          };
        }
      }
    }
  }
  return null;
}

export async function openPrinterDevice(
  deviceInfo: UsbDeviceInfo,
): Promise<{ device: UsbDeviceType } & PrinterInterface> {
  const devices = await usb.getDevices();
  const device = devices.find(
    (d) =>
      d.vendorId === deviceInfo.vendorId &&
      d.productId === deviceInfo.productId &&
      (d.serialNumber ?? "") === deviceInfo.serialNumber,
  );

  if (!device) throw new Error("Printer device not found");

  await device.open();

  if (device.configuration?.bConfigurationValue !== 1) {
    try {
      await device.selectConfiguration(1);
    } catch (err) {
      logger.warn(`Failed to set USB configuration: ${err}`);
    }
  }

  const iface = findPrinterInterface(device);
  if (!iface) throw new Error("No USB Printer class interface (class 7) found on device");

  try {
    await device.detachKernelDriver(iface.interfaceNumber);
  } catch {
    // kernel driver may not be attached
  }

  try {
    await device.claimInterface(iface.interfaceNumber);
  } catch (err) {
    throw new Error(`Failed to claim interface ${iface.interfaceNumber}: ${err}`);
  }

  return { device, ...iface };
}

export class PrinterDevice {
  constructor(
    private readonly device: UsbDeviceType,
    private readonly endpointNumber: number,
    private readonly packetSize: number,
  ) {}

  async write(data: Uint8Array): Promise<void> {
    for (let i = 0; i < data.length; i += this.packetSize) {
      const chunk = data.slice(i, i + this.packetSize);
      await this.device.nativeTransferOut(this.endpointNumber, 5000, chunk);
    }
  }

  async release(interfaceNumber: number): Promise<void> {
    try {
      await this.device.releaseInterface(interfaceNumber);
      await this.device.close();
    } catch (err) {
      logger.warn(`Failed to release printer device: ${err}`);
    }
  }
}
