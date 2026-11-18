import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { Location, NgTemplateOutlet } from '@angular/common';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideImage,
  lucideImagePlus,
  lucideImageUp,
  lucideLoader2,
  lucideLocationEdit,
  lucidePrinter,
  lucideRotateCw,
  lucideTextCursorInput,
  lucideX,
} from '@ng-icons/lucide';
import { UsbDeviceService } from '../../../services/usb-device-service';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { ReceiptPrinterService } from '../../../services/receipt-printer-service';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, of, skip, switchMap, tap } from 'rxjs';
import { UsbDeviceInfo } from '@micropos/shared/src';
import {
  form,
  FormField,
  FormRoot,
  max,
  maxLength,
  min,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { StoreConfigService } from '../../../services/store-config.service';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { AssetsService } from '../../../services/assets-service';

type FormFieldState = 'idle' | 'saving' | 'saved';

@Component({
  selector: 'app-receipt-printer-configuration',
  imports: [
    HlmDialogImports,
    HlmButtonImports,
    HlmFieldImports,
    HlmSelectImports,
    HlmIconImports,
    NgIcon,
    HlmInputImports,
    HlmInputGroupImports,
    FormsModule,
    FormRoot,
    FormField,
    NgTemplateOutlet,
    HlmTextareaImports,
  ],
  viewProviders: [
    provideIcons({
      lucideRotateCw,
      lucidePrinter,
      lucideCheck,
      lucideX,
      lucideLoader2,
      lucideLocationEdit,
      lucideTextCursorInput,
      lucideImage,
      lucideImagePlus,
      lucideImageUp,
    }),
  ],
  templateUrl: './receipt-printer-configuration.html',
  styleUrl: './receipt-printer-configuration.css',
})
export class ReceiptPrinterConfiguration {
  private readonly dR = inject(DestroyRef);
  private readonly location = inject(Location);
  readonly assetService = inject(AssetsService);
  readonly usbDeviceService = inject(UsbDeviceService);
  readonly receiptPrinterService = inject(ReceiptPrinterService);
  readonly storeConfigService = inject(StoreConfigService);

  readonly usbDevicesList = this.usbDeviceService.devices;

  onDialogClosed(): void {
    this.location.back();
  }

  // STORE LOGO
  private readonly _storeLogoModel = signal<{ file: File | null }>({
    file: null,
  });
  protected readonly storeLogoState = signal<FormFieldState>('idle');
  protected readonly storeLogoForm = form(this._storeLogoModel, (schema) => {
    // Optional validations if needed
  });
  // STORE NAME
  private readonly _storeNameModel = signal<{ storeName: string }>({
    storeName: '',
  });
  protected readonly storeNameState = signal<FormFieldState>('idle');
  protected readonly storeNameForm = form(this._storeNameModel, (schema) => {
    maxLength(schema.storeName, 50, { message: 'Maximum characters: 50' });
    minLength(schema.storeName, 1, { message: ' Minimum characters: 1' });
  });

  // STORE ADDRESS
  private readonly _storeAddressModel = signal<{ storeAddress: string }>({
    storeAddress: '',
  });
  protected readonly storeAddressState = signal<FormFieldState>('idle');
  protected readonly storeAddressForm = form(this._storeAddressModel, (schema) => {
    maxLength(schema.storeAddress, 50, { message: 'Maximum characters: 50' });
    minLength(schema.storeAddress, 1, { message: ' Minimum characters: 1' });
  });

  // PAPER WIDTH
  private readonly _paperWidthMmModel = signal<{ paperWidthMm: number }>({
    paperWidthMm: 0,
  });
  protected readonly paperWidthMmState = signal<FormFieldState>('idle');
  protected readonly paperWidthMmForm = form(this._paperWidthMmModel, (schema) => {
    min(schema.paperWidthMm, 58, { message: 'Minimum paper width: 58mm' });
    max(schema.paperWidthMm, 112, { message: 'Maximum paper width: 112mm' });
  });

  // RECEIPT PRINTER USB
  private readonly _receiptPrinterUsbDeviceModel = signal<{
    receiptPrinterUsbDevice: UsbDeviceInfo | null;
  }>({
    receiptPrinterUsbDevice: null,
  });
  protected readonly receiptPrinterUsbDeviceState = signal<FormFieldState>('idle');
  protected readonly receiptPrinterUsbDeviceForm = form(
    this._receiptPrinterUsbDeviceModel,
    (schema) => {
      required(schema.receiptPrinterUsbDevice, { message: 'Required' });
    },
  );
  protected readonly customReceiptPrinterUsbDeviceFormErrors = signal<Record<string, string>>({});
  protected readonly customReceiptPrinterUsbDeviceFormErrorsArray = computed(() =>
    Object.entries(this.customReceiptPrinterUsbDeviceFormErrors()).map(([kind, message]) => ({
      kind,
      message,
    })),
  );

  async ngOnInit() {
    const { paperWidthMm } = this.receiptPrinterService.receiptConfig() ?? {};
    const autoconnectUsbDevice = this.receiptPrinterService.printerDevice();
    const { storeName, storeAddress } = this.storeConfigService.config();

    this._storeNameModel.set({ storeName: storeName ?? '' });
    this._storeAddressModel.set({ storeAddress: storeAddress ?? '' });
    this._paperWidthMmModel.set({ paperWidthMm: paperWidthMm ?? 0 });
    this._receiptPrinterUsbDeviceModel.set({
      receiptPrinterUsbDevice: autoconnectUsbDevice ?? null,
    });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    // Update the signal model directly to trigger the auto-submit pipeline
    this._storeLogoModel.set({ file });
  }

  initializeSubmitHandlers() {
    const destroyRef = this.dR;

    toObservable(this._storeLogoModel)
      .pipe(
        skip(1), // Skip initial empty emission
        distinctUntilChanged((a, b) => a.file === b.file),
        tap(() => this.storeLogoState.set('saving')),
        debounceTime(300), // Quick trigger for file selection
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(async () => {
        await submit(this.storeLogoForm, async (formInstance) => {
          const { file } = this._storeLogoModel();

          if (!file) {
            this.storeLogoState.set('idle');
            return undefined;
          }

          try {
            // await this.storeAssetsService.uploadLogo(file);
            await this.assetService.uploadStoreAsset('store_logo', file);
            this.storeLogoState.set('saved');
            return undefined;
          } catch (err: any) {
            this.storeLogoState.set('idle');
            return [
              {
                kind: 'server',
                message: err?.message || 'Failed to upload logo',
                fieldTree: formInstance.file,
              },
            ];
          }
        });
      });

    toObservable(this._storeNameModel)
      .pipe(
        skip(1),
        distinctUntilChanged((a, b) => a.storeName === b.storeName),
        tap(() => this.storeNameState.set('saving')),
        debounceTime(750),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(async () => {
        await submit(this.storeNameForm, async (formInstance) => {
          const { storeName } = this._storeNameModel();
          const { status, data, error } = await this.storeConfigService.update({
            storeName,
          });
          if (status !== 200) {
            console.log('not 200 reached', { status, data });
            this.storeNameState.set('idle');
            return [
              {
                kind: 'server',
                message: error,
                fieldTree: formInstance.storeName,
              },
            ];
          } else {
            this.storeNameState.set('saved');
            return undefined;
          }
        });
      });

    toObservable(this._storeAddressModel)
      .pipe(
        skip(1),
        distinctUntilChanged((a, b) => a.storeAddress === b.storeAddress),
        tap(() => this.storeAddressState.set('saving')),
        debounceTime(750),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(async () => {
        await submit(this.storeAddressForm, async (formInstance) => {
          const { storeAddress } = this._storeAddressModel();
          const { status, data, error } = await this.storeConfigService.update({
            storeAddress,
          });
          if (status !== 200) {
            console.log('not 200 reached', { status, data });
            this.storeAddressState.set('idle');
            return [
              {
                kind: 'server',
                message: error,
                fieldTree: formInstance.storeAddress,
              },
            ];
          } else {
            this.storeAddressState.set('saved');
            return undefined;
          }
        });
      });

    toObservable(this._receiptPrinterUsbDeviceModel)
      .pipe(
        skip(1),
        distinctUntilChanged(
          (a, b) =>
            JSON.stringify(a.receiptPrinterUsbDevice) === JSON.stringify(b.receiptPrinterUsbDevice),
        ),
        tap(() => this.receiptPrinterUsbDeviceState.set('saving')),
        debounceTime(750),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(async () => {
        await submit(this.receiptPrinterUsbDeviceForm, async (formInstance) => {
          const { receiptPrinterUsbDevice } = this._receiptPrinterUsbDeviceModel();
          if (!receiptPrinterUsbDevice) {
            return undefined;
          }
          const { status, data, error } =
            await this.receiptPrinterService.connect(receiptPrinterUsbDevice);

          if (status !== 200) {
            this.receiptPrinterUsbDeviceState.set('idle');
            return [
              {
                kind: 'server',
                message: error,
                fieldTree: formInstance.receiptPrinterUsbDevice,
              },
            ];
          } else {
            this.receiptPrinterUsbDeviceState.set('saved');
            return undefined;
          }
        });
      });

    toObservable(this._paperWidthMmModel)
      .pipe(
        skip(1),
        distinctUntilChanged((a, b) => a.paperWidthMm === b.paperWidthMm),
        filter(() => this.paperWidthMmForm().valid()),
        tap(() => this.paperWidthMmState.set('saving')),
        debounceTime(750),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(async () => {
        await submit(this.paperWidthMmForm, async (formInstance) => {
          const { paperWidthMm } = this._paperWidthMmModel();

          const { status, data, error } = await this.receiptPrinterService.updateConfig({
            paperWidthMm,
          });

          if (status !== 200) {
            this.paperWidthMmState.set('idle');
            return [
              {
                kind: 'server',
                message: error,
                fieldTree: formInstance.paperWidthMm,
              },
            ];
          } else {
            this.paperWidthMmState.set('saved');
            return undefined;
          }
        });
      });
  }

  constructor() {
    this.initializeSubmitHandlers();

    effect(() => {
      const device = this._receiptPrinterUsbDeviceModel().receiptPrinterUsbDevice;
      const isConnected = this.receiptPrinterService.status() === 'connected';

      if (device && !isConnected && this.usbDevicesList().length > 0) {
        this.customReceiptPrinterUsbDeviceFormErrors.set({
          disconnected: 'Printer is disconnected',
        });
      } else {
        this.customReceiptPrinterUsbDeviceFormErrors.set({});
      }
    });
  }
}
