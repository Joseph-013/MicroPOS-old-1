export interface HIDDevice {
  vendorId: number;
  productId: number;
  path?: string | undefined;
  serialNumber?: string | undefined;
  manufacturer?: string | undefined;
  product?: string | undefined;
  release: number;
  interface: number;
  usagePage?: number | undefined;
  usage?: number | undefined;
}

export interface UsbDeviceInfo {
  vendorId: number;
  productId: number;
  productName: string;
  serialNumber: string;
  manufacturerName: string;
  deviceKey: string;
  label: string;
}
