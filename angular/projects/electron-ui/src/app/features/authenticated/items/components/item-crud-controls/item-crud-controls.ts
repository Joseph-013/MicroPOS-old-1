import { Component, effect, inject, model, output, signal } from '@angular/core';
import {
  form,
  max,
  maxLength,
  min,
  minLength,
  readonly,
  required,
  FormField,
  FormRoot,
  pattern,
  submit,
  validate,
} from '@angular/forms/signals';
import { ApiResponse, Item, NewItem, UpdateItem } from '@micropos/shared/src';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArchiveRestore,
  lucideArrowRightFromLine,
  lucideCirclePlus,
  lucideEdit,
  lucideListPlus,
  lucidePackagePlus,
  lucidePrinter,
  lucideSave,
  lucideSend,
  lucideTrash,
  lucideXCircle,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import {
  ItemService,
  PRICE_MODE_OPTIONS,
  PRICE_MODE_TO_LABEL_MAP,
  PRICE_MODES,
} from '../../../../../services/data/item-service';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmInput } from '@spartan-ng/helm/input';
import { FormMode, maxDecimal, select, ToggleField } from '@angular-shared';
import { ToggleFieldDirective } from '../../../../../../../../shared/src/lib/directives/form-mode';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { ScannerService } from '../../../../../services/scanner-service';
import { ItemsScanServiceFocusOptions } from '../../items';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { ClickToCopyDirective } from '../../../../../directives/click-to-copy-directive';
import { PriceTag } from '../../../../../shared/components/price-tag/price-tag';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';

const createEmptyForm = () => ({
  id: '',
  barcode: '',
  plu: '',
  sku: '',
  name: '',
  priceMode: null,
  price: 0,
  createdAt: '',
  updatedAt: '',
  deletedAt: '',
});

@Component({
  selector: 'app-item-crud-controls',
  imports: [
    NgIcon,
    HlmButtonImports,
    HlmFieldImports,
    FormField,
    FormRoot,
    HlmInput,
    ToggleField,
    ToggleFieldDirective,
    DatePipe,
    HlmIconImports,
    ClickToCopyDirective,
    CurrencyPipe,
    PriceTag,
    HlmSelectImports,
    HlmInputGroupImports,
  ],
  viewProviders: [
    provideIcons({
      lucideListPlus,
      lucideCirclePlus,
      lucideArrowRightFromLine,
      lucideEdit,
      lucideXCircle,
      lucideSend,
      lucideSave,
      lucidePackagePlus,
      lucideTrash,
      lucideArchiveRestore,
      lucidePrinter,
    }),
  ],
  templateUrl: './item-crud-controls.html',
  styleUrl: './item-crud-controls.css',
})
export class ItemCrudControls {
  private readonly itemService = inject(ItemService);

  readonly scannerService = inject(ScannerService);
  readonly scanServiceFocus = model<ItemsScanServiceFocusOptions>();

  readonly onDismiss = output();
  readonly onDelete = output<Item>();
  readonly onRestore = output<Item>();
  readonly onSubmitOutput = output({ alias: 'onSubmit' });

  readonly patchItem = model.required<Item | null>();
  protected readonly formMode = signal<FormMode | null>(null);

  protected readonly _model = signal(createEmptyForm());

  protected readonly PriceModeOptions = PRICE_MODE_OPTIONS;

  protected readonly PriceModeToLabelMap = PRICE_MODE_TO_LABEL_MAP;

  protected readonly priceTagData = signal<{
    price: number;
    name: string;
    barcode?: string | null;
  } | null>(null);

  public readonly itemForm = form(this._model, (schema) => {
    readonly(schema.id);

    validate(schema.barcode, ({ value }) => {
      if (!!this._model().plu && !!value())
        return { kind: 'barcode', message: 'PLU already exists. Choose only 1.' };
      return null;
    });
    minLength(schema.barcode, 8, { message: 'Must be at least 8 characters' });
    maxLength(schema.barcode, 48, { message: 'Cannot exceed 48 characters' });

    validate(schema.plu, ({ value }) => {
      if (!!this._model().barcode && !!value())
        return { kind: 'plu', message: 'Barcode already exists. Choose only 1.' };
      return null;
    });
    minLength(schema.plu, 5, { message: 'Must be exactly 5 characters' });
    maxLength(schema.plu, 5, { message: 'Must be exactly 5 characters' });

    minLength(schema.sku, 3, { message: 'Too short for a valid SKU' });
    maxLength(schema.sku, 30, { message: 'SKU cannot exceed 30 characters' });
    pattern(schema.sku, /^[a-zA-Z0-9\-_./#]+$/, {
      message: 'SKU can only contain letters, numbers, and - _ . / #',
    });

    required(schema.name, { message: 'Required' });
    minLength(schema.name, 2, { message: 'Name must be at least 2 characters' });
    maxLength(schema.name, 100, { message: 'Name is too long (max 100)' });

    select(schema.priceMode, PRICE_MODES, { max: 1 });

    min(schema.price, 0, { message: 'Price cannot be negative' });
    max(schema.price, 999999.99, { message: 'Price exceeds maximum allowed value' });
    maxDecimal(schema.price, 2);

    readonly(schema.createdAt);
    readonly(schema.updatedAt);
    readonly(schema.deletedAt);
  });

  resetForm() {
    if (this.formMode() === 'creating') {
      this._model.set(createEmptyForm());
      this.itemForm().reset();
    }
    if (this.formMode() === 'editing') {
      this.itemForm().reset();
    }
  }

  dismiss() {
    this._model.set(createEmptyForm());
    this.patchItem.set(null);
    this.formMode.set(null);
  }

  readonly modeToString = (value: string) => this.PriceModeToLabelMap[value];

  onSubmit(): void {
    submit(this.itemForm, async (formInstance) => {
      const model = this._model();
      const { id, createdAt, updatedAt, deletedAt, ...updateFields } = model;

      if (this.formMode() === 'editing') {
        const updatePayload: UpdateItem = Object.fromEntries(
          // Object.entries(updateFields).map(([key, value]) => [key, value === '' ? null : value]),
          Object.entries(updateFields).map(([key, value]) => [key, value || null]),
        );

        const response = await firstValueFrom(this.itemService.update(id, updatePayload));
        console.log(response);

        if (response.status === 200) {
          this.onSubmitOutput.emit();
          toast.success('Item updated');
          this.fetchItemData(id);
          return undefined;
        }

        if (response.status === 409 && response.error?.field) {
          const field = response.error.field;
          return [
            {
              kind: 'server',
              message: response.error.message,
              fieldTree: (formInstance as any)[field],
            },
          ];
        }

        toast.error('Failed to update item', { description: response.error?.message });
        return undefined;
      }

      if (this.formMode() === 'creating') {
        const createPayload: NewItem = {
          // barcode: updateFields.barcode === '' ? null : updateFields.barcode,
          // sku: updateFields.sku === '' ? null : updateFields.sku,
          barcode: updateFields.barcode || null,
          plu: updateFields.plu || null,
          sku: updateFields.sku || null,
          name: updateFields.name,
          priceMode: updateFields.priceMode,
          price: Number(updateFields.price),
        };

        const response = await firstValueFrom(this.itemService.create(createPayload));

        if (response.status === 200 && response.data) {
          this.onSubmitOutput.emit();
          toast.success('Item created');
          this.patchItem.set(response.data);
          this.fetchItemData(response.data.id);
          return undefined;
        }

        if (response.status === 409 && response.error?.field) {
          const field = response.error.field;
          return [
            {
              kind: 'server',
              message: response.error.message,
              fieldTree: (formInstance as any)[field],
            },
          ];
        }

        toast.error('Failed to create item', { description: response.error?.message });
        return undefined;
      }

      return undefined;
    });
  }

  cancelOperation() {
    const mode = this.formMode();
    if (mode === 'editing') {
      this.formMode.set('viewing');
    }
    if (mode === 'creating') {
      this.formMode.set(null);
    }
  }

  handlePrintPriceTag() {
    const currentItem = this.patchItem();
    if (!currentItem) return;

    this.priceTagData.set({
      price: currentItem.price,
      name: currentItem.name,
      barcode: currentItem.barcode,
    });
  }

  fetchItemData(id: string): void {
    this.itemService
      .get(id, { withDeleted: true })
      .subscribe((response: ApiResponse<Item | undefined>) => {
        const { status, data } = response;
        if (status === 404 || !data) {
          toast.error('Failed to fetch data', {
            description: "Something went wrong fetching this item's data",
          });
          return;
        }
        this._model.set(
          Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, value ?? '']),
          ) as ReturnType<typeof this._model>,
        );
        this.formMode.set('viewing');
      });
  }

  constructor() {
    effect(() => {
      const item = this.patchItem();
      if (!item) {
        this._model.set(createEmptyForm());
        this.formMode.set(null);
        return;
      }
      this.fetchItemData(item.id);
    });

    this.scannerService.dataStream$
      .pipe(
        takeUntilDestroyed(),
        filter(() => this.scanServiceFocus() === 'item-crud-controls-barcode-input'),
      )
      .subscribe(({ barcode }) => this._model.update((prev) => ({ ...prev, barcode: barcode })));
  }
}
