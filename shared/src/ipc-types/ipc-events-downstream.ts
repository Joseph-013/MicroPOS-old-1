import { HIDDevice, UsbDeviceInfo } from "../types";

export interface IpcEventsDownstream {
  hidDeviceListUpdated: HIDDevice[];
  usbDeviceListUpdated: UsbDeviceInfo[];
  onPrinterPaperWidthChanged: number;
  onBarcodeScanned: {
    source: string;
    barcode: string;
  };
}
