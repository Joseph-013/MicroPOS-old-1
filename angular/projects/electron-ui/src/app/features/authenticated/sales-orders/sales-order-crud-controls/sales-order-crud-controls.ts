import { FormMode, StorageService, ToggleField } from '@angular-shared';
import { Component, effect, inject, model, output, signal } from '@angular/core';
import { FormField, FormRoot } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { ToggleFieldDirective } from '../../../../../../../shared/src/lib/directives/form-mode';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import {
  lucideArchiveRestore,
  lucideArrowRightFromLine,
  lucideCirclePlus,
  lucideEdit,
  lucideExternalLink,
  lucideListPlus,
  lucidePackagePlus,
  lucidePrinter,
  lucideSave,
  lucideSend,
  lucideTrash,
  lucideXCircle,
} from '@ng-icons/lucide';
import { SalesOrderService } from '../../../../services/data/sales-order-service';
import { ScannerService } from '../../../../services/scanner-service';
import { SalesOrder, SalesOrderItem } from '@micropos/shared/src';
import { SalesOrderItemService } from '../../../../services/data/sales-order-item-service';
import { catchError, forkJoin, map, merge, of } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AddCartItemParams } from '../../../../services/cart-service';
import { Router } from '@angular/router';
import { ClickToCopyDirective } from '../../../../directives/click-to-copy-directive';
import { ReceiptPrinterService } from '../../../../services/receipt-printer-service';
import { SalesOrderReceiptPrintService } from '../../../../services/sales-order-receipt-print-service';
import { AssetsService } from '../../../../services/assets-service';
import { StoreConfigService } from '../../../../services/store-config.service';

@Component({
  selector: 'app-sales-order-crud-controls',
  imports: [
    NgIcon,
    HlmButtonImports,
    HlmFieldImports,
    DatePipe,
    HlmIconImports,
    CurrencyPipe,
    HlmTableImports,
    ClickToCopyDirective,
    CurrencyPipe,
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
      lucideExternalLink,
      lucideArchiveRestore,
      lucidePrinter,
    }),
  ],
  templateUrl: './sales-order-crud-controls.html',
  styleUrl: './sales-order-crud-controls.css',
})
export class SalesOrderCrudControls {
  private readonly salesOrderService = inject(SalesOrderService);
  private readonly salesOrderItemService = inject(SalesOrderItemService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  readonly scannerService = inject(ScannerService);
  readonly onDismiss = output();
  readonly onDelete = output<SalesOrder>();
  readonly onRestore = output<SalesOrder>();
  readonly onSubmitOutput = output({ alias: 'onSubmit' });
  readonly patchSalesOrder = model<SalesOrder | null>();
  protected readonly formMode = signal<FormMode | null>(null);
  protected readonly salesOrderData = signal<
    (SalesOrder & { salesOrderItems: SalesOrderItem[] }) | null
  >(null);
  private readonly receiptPrinterService = inject(ReceiptPrinterService);
  private readonly salesOrderReceiptPrinter = inject(SalesOrderReceiptPrintService);
  private readonly assetService = inject(AssetsService);
  private readonly storeConfigService = inject(StoreConfigService);

  dismiss(): void {
    this.patchSalesOrder.set(null);
    this.formMode.set(null);
    this.salesOrderData.set(null);
    this.onDismiss.emit();
  }

  cancelOperation() {
    const mode = this.formMode();
    if (mode === 'creating') {
      this.formMode.set(null);
    } else {
      this.formMode.set('viewing');
    }
  }

  fetchSalesOrderData(id: string): void {
    forkJoin({
      salesOrderResponse: this.salesOrderService.get(id),
      salesOrderItemsResponse: this.salesOrderItemService.getBySalesOrderId(id),
    })
      .pipe(
        map(({ salesOrderResponse, salesOrderItemsResponse }) => {
          if (salesOrderResponse.status !== 200 || !salesOrderResponse.data) {
            throw new Error('Failed to fetch sales order metadata');
          }

          if (salesOrderItemsResponse.status !== 200 || !salesOrderItemsResponse.data) {
            throw new Error('Failed to fetch sales order line items.');
          }

          return {
            ...salesOrderResponse.data,
            salesOrderItems: salesOrderItemsResponse.data,
          };
        }),
        catchError((error: Error) => {
          toast.error(error.message || 'Failed to aggregate sales order payload.');
          console.error(error);
          return of(null);
        }),
      )
      .subscribe((mergedPayload) => {
        this.salesOrderData.set(mergedPayload);
        this.formMode.set('viewing');
      });
  }

  handleCopyToCheckout() {
    const items: AddCartItemParams[] =
      this.salesOrderData()?.salesOrderItems.map((i) => ({
        id: i.itemId,
        quantity: i.quantity,
      })) ?? [];

    if (!items) return;

    this.storage.set('checkout-itemsToAddToCart', items);

    toast.success('Sales Order Items Copied', {
      description: 'Sales order items copied to checkout',
      action: {
        label: 'To Checkout',
        onClick: () => this.router.navigate(['/authenticated', 'checkout']),
      },
    });
  }

  handlePrint() {
    const salesOrderId = this.patchSalesOrder()?.id;

    if (!salesOrderId) return;
    if (!this.receiptPrinterService.isReadyForPrinting()) {
      toast.error('Printer Configuration Error', {
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

    this.salesOrderReceiptPrinter.printSalesOrderReceipt(
      this.salesOrderService,
      this.salesOrderItemService,
      this.receiptPrinterService,
      this.assetService,
      this.storeConfigService,
      salesOrderId,
    );
  }

  constructor() {
    effect(() => {
      const salesOrder = this.patchSalesOrder();
      if (!salesOrder) {
        this.salesOrderData.set(null);
        this.formMode.set(null);
        return;
      }
      this.fetchSalesOrderData(salesOrder.id);
    });

    // this.scannerService.dataStream$
    //   .pipe(
    //     takeUntilDestroyed(),
    //     filter(() => this.scanServiceFocus() === 'item-crud-controls-barcode-input'),
    //   )
    //   .subscribe(({ barcode }) => this._model.update((prev) => ({ ...prev, barcode: barcode })));
  }
}
