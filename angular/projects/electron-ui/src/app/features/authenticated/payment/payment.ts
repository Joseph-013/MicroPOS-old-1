import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { CartService, PAYMENT_ITEMS_KEY } from '../../../services/cart-service';
import { ActiveCheckoutItem, StorageService } from '@angular-shared';
import { CurrencyPipe } from '@angular/common';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmButton } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCheckCircle,
  lucideCircleX,
  lucideCopy,
  lucidePhilippinePeso,
  lucidePrinterCheck,
} from '@ng-icons/lucide';
import { form, FormField, FormRoot, max, min, required, submit } from '@angular/forms/signals';
import { SalesOrderService } from '../../../services/data/sales-order-service';
import { NewSalesOrder, SalesOrder, SalesOrderItem } from '@micropos/shared/src';
import { firstValueFrom } from 'rxjs';
import { ReceiptPrinterService } from '../../../services/receipt-printer-service';
import { toast } from '@spartan-ng/brain/sonner';

@Component({
  selector: 'app-payment',
  imports: [
    HlmSeparatorImports,
    HlmTableImports,
    CurrencyPipe,
    HlmFieldImports,
    HlmInputGroupImports,
    HlmButton,
    NgIcon,
    FormField,
    FormRoot,
  ],
  viewProviders: [
    provideIcons({
      lucidePhilippinePeso,
      lucideCircleX,
      lucideArrowLeft,
      lucideCheckCircle,
      lucidePrinterCheck,
      lucideCopy,
    }),
  ],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit, OnDestroy {
  protected readonly router = inject(Router);
  protected readonly cartService = inject(CartService);
  private readonly storage = inject(StorageService);
  private readonly paymentSuccess = signal<boolean>(false);
  private readonly salesOrderService = inject(SalesOrderService);
  private readonly receiptPrinterService = inject(ReceiptPrinterService);

  protected readonly grandTotal = computed((): number => {
    return Object.values(this.itemDetails()).reduce((acc, i) => {
      return acc + i.quantity * i.price;
    }, 0);
  });

  protected readonly changeAmountMismatchWarning = computed((): boolean => {
    const pipedGrandTotal = this.grandTotal();
    const amountTendered = this.form.amountTendered().value();
    const changeAmount = this.form.changeAmount().value();
    if (
      this.form.changeAmount().valid() &&
      this.form.amountTendered().valid() &&
      amountTendered > 0
    ) {
      return amountTendered !== pipedGrandTotal + changeAmount;
    } else {
      return false;
    }
  });

  protected readonly disableChangeAmountAutofill = computed((): boolean => {
    const pipedGrandTotal = this.grandTotal();
    const amountTendered = this.form.amountTendered().value();
    return amountTendered <= pipedGrandTotal || amountTendered == 0;
  });

  protected readonly itemOrder = signal<string[]>([]);

  protected readonly itemDetails = signal<Record<string, ActiveCheckoutItem>>({});

  protected readonly _model = signal({
    amountTendered: 0,
    changeAmount: 0,
  });

  protected readonly form = form(this._model, (schema) => {
    required(schema.amountTendered, { message: 'Required' });
    min(schema.amountTendered, 0);
    max(schema.amountTendered, 999999999);

    required(schema.changeAmount, { message: 'Required' });
    min(schema.changeAmount, 0);
    max(schema.changeAmount, 999999999);
  });

  clearAmountTendered(): void {
    this._model.update((prev) => ({
      ...prev,
      amountTendered: 0,
    }));
  }

  clearChangeAmount(): void {
    this._model.update((prev) => ({
      ...prev,
      changeAmount: 0,
    }));
  }

  ngOnInit() {
    const { order, details } =
      this.storage.get<{ order: string[]; details: Record<string, ActiveCheckoutItem> }>(
        PAYMENT_ITEMS_KEY,
      ) ?? {};
    if (order?.length === 0) this.router.navigate(['./authenticated', 'checkout']);
    this.itemOrder.set(order!);
    this.itemDetails.set(details!);
  }

  async handleComplete(print?: boolean) {
    if (print && !this.receiptPrinterService.isReadyForPrinting()) {
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

    const printRequest = async (id: string) => {
      // FIXME
      // const response = await this.receiptPrinterService.printBySalesOrderId(id);
      // if (response.status === 200) {
      //   toast.success('Sales Order Complete', {
      //     description: 'Print job sent...',
      //   });
      // } else {
      //   toast.success('Sales Order Complete', {
      //     description: 'Error: Print job failed.',
      //   });
      // }
    };

    submit(this.form, async (formInstance) => {
      const { amountTendered, changeAmount } = this._model();

      const items: NewSalesOrder['items'] = this.itemOrder().map((itemId) => ({
        itemId,
        quantity: this.itemDetails()[itemId].quantity,
      }));

      const { status, data, error } = await firstValueFrom(
        this.salesOrderService.create({
          amountTendered: amountTendered,
          changeAmount: changeAmount,
          snapshotTotalAmount: this.grandTotal(),
          items,
        }),
      );

      if (status == 201) {
        const { id } = data as SalesOrder & { items: SalesOrderItem[] };
        this.paymentSuccess.set(true);
        if (print) {
          await printRequest(id);
        } else {
          toast.success('Sales Order Complete.');
        }
        this.return();
      }
    });
  }

  handleCopyTotal() {
    const newTenderValue = this.grandTotal();
    this._model.update((prev) => ({
      ...prev,
      amountTendered: newTenderValue,
    }));
  }

  handleAutofillChangeAmount() {
    this._model.update((prev) => {
      // 1. Ensure inputs are treated as whole numbers
      const tendered = Math.round(prev.amountTendered * 100);
      const total = Math.round(this.grandTotal() * 100);

      // 2. Perform math on integers
      const newChangeAmount = (tendered - total) / 100;

      // 3. Round to exactly 2 decimal places to clean up any tiny floating-point residue
      const cleanChange = Math.round(newChangeAmount * 100) / 100;

      return {
        ...prev,
        changeAmount: cleanChange,
      };
    });
  }

  return() {
    this.router.navigate(['/authenticated', 'checkout']);
  }

  ngOnDestroy() {
    if (this.paymentSuccess()) {
      this.cartService.clearPaymentItems();
    } else {
      this.cartService.movePaymentToCart();
    }
  }
}
