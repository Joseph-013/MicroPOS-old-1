import { OnDestroy, OnInit, Service, signal } from '@angular/core';
import { ApiResponse, UsbDeviceInfo } from '@micropos/shared/src';
import { Subject } from 'rxjs';

@Service()
export class UsbDeviceService {
  readonly _devices = signal<UsbDeviceInfo[]>([]);
  readonly devices = this._devices.asReadonly();

  private readonly _onDevicesUpdate = new Subject();
  readonly onDevicesUpdate = this._onDevicesUpdate.asObservable();

  constructor() {
    window.electronAPI
      .invoke<ApiResponse<UsbDeviceInfo[]>>('usb-device-manager:getUSBDevices')
      .then((response: ApiResponse<UsbDeviceInfo[]>) => {
        if (response.status === 200 && response.data) {
          this._devices.set(response.data);
        }
      });

    window.electronAPI.on('usb-device-manager:onDeviceListUpdated', (devices: UsbDeviceInfo[]) => {
      this._devices.set(devices);
    });
  }

  async refreshDevices(): Promise<void> {
    const response = await window.electronAPI.invoke<ApiResponse<UsbDeviceInfo[]>>(
      'usb-device-manager:getUSBDevices',
    );
    if (response.status === 200 && response.data) {
      this._devices.set(response.data);
    }
  }
}
