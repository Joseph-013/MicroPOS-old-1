import { computed, effect, inject, Service, signal, untracked } from '@angular/core';
import { ApiResponse, ReceiptConfig, SalesOrder, UsbDeviceInfo } from '@micropos/shared/src';
import { toast } from '@spartan-ng/brain/sonner';
import { Router } from '@angular/router';

export interface PrinterState {
  connected: boolean;
  device: UsbDeviceInfo | null;
  config: ReceiptConfig | null;
}

@Service()
export class ReceiptPrinterService {
  private readonly router = inject(Router);

  private readonly _state = signal<PrinterState>({
    connected: false,
    device: null,
    config: null,
  });

  public readonly printerDevice = computed(() => this._state().device);
  public readonly receiptConfig = computed(() => this._state().config);
  public readonly status = computed(() => (this._state().connected ? 'connected' : 'disconnected'));
  public readonly isReadyForPrinting = computed(
    () => this._state().connected && this._state().config !== null,
  );

  constructor() {
    effect(() => console.log(this.status()));
    this.syncState();

    window.electronAPI.on('receipt-printer:stateChanged', (state: PrinterState) => {
      this._state.set(state);
    });

    window.electronAPI.on('receipt-printer:error', (errorMsg: string) => {
      toast.error('Printer Error', {
        description: errorMsg,
        action: {
          label: 'Settings',
          onClick: () =>
            this.router.navigate(['/authenticated', 'settings', 'configure-receipt-printer']),
        },
      });
    });
  }

  private async syncState(): Promise<void> {
    try {
      const state = await window.electronAPI.invoke<PrinterState>('receipt-printer:status');
      this._state.set(state);
    } catch (err) {
      console.error('Failed to sync printer state:', err);
    }
  }

  async connect(usbDeviceInfo: UsbDeviceInfo): Promise<ApiResponse<string>> {
    return await window.electronAPI.invoke('receipt-printer:connect', { usbDeviceInfo });
  }

  async print(data: Uint8Array<ArrayBufferLike>): Promise<ApiResponse<string> | void> {
    if (!this.isReadyForPrinting()) {
      toast.error('Printer Error', {
        description: 'Device is not ready for printing.',
        action: {
          label: 'To Settings',
          onClick: () =>
            this.router.navigate(['/authenticated', 'settings', 'configure-receipt-printer'], {
              replaceUrl: true,
            }),
        },
      });
      return;
    }
    return await window.electronAPI.invoke<ApiResponse<string>>('receipt-printer:print', data);
  }

  async updateConfig(config: Partial<ReceiptConfig>): Promise<ApiResponse<string>> {
    return await window.electronAPI.invoke('receipt-printer:update-config', config);
  }

  async disconnect(): Promise<void> {
    await window.electronAPI.invoke('receipt-printer:disconnect');
    // State will automatically update via the 'receipt-printer:stateChanged' event from Electron
  }
}
