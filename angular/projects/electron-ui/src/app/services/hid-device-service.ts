import { OnInit, OnDestroy, Service, signal } from '@angular/core';
import { ApiResponse, HIDDevice } from '@micropos/shared/src';
import { Subject, Observable } from 'rxjs';

@Service()
export class HIDDeviceService {
  // readonly _devices = signal<HIDDevice[]>([]);
  // readonly devices = this._devices.asReadonly();
  // private readonly _onDevicesUpdate = new Subject();
  // readonly onDevicesUpdate = this._onDevicesUpdate.asObservable();
  // constructor() {
  //   window.electronAPI.invoke('getHIDDevices').then((response) => this._devices.set(response.data));
  //   window.electronAPI.on('hidDeviceListUpdated', (devices: HIDDevice[]) => {
  //     this._devices.set(devices ?? []);
  //     this._onDevicesUpdate.next(devices);
  //   });
  // }
  // async refreshDevices() {
  //   await window.electronAPI.invoke('getHIDDevices').then((response) => {
  //     this._devices.set(response.data);
  //     console.log(response.data);
  //   });
  // }
  // async ngOnInit() {}
  // async disconnectActiveDevice(): Promise<void> {
  //   // HID close logic
  // }
  // ngOnDestroy(): void {
  //   // window.electronAPI.invoke('scannerInterceptorSetStatus', { state: false });
  // }
}
