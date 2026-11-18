import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { CartTable } from './components/cart-table/cart-table';
import { DecodeDbFloatPipe, decodeEan13, QuantityStepper, StorageService } from '@angular-shared';
import { AddCartItemParams, CartService } from '../../../services/cart-service';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmAutocompleteImports } from '@spartan-ng/helm/autocomplete';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map, mergeMap, skip, switchMap } from 'rxjs';
import { ItemService } from '../../../services/data/item-service';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButton, HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmToggleImports } from '@spartan-ng/helm/toggle';
import { BannerService } from '../../../services/banner-service';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheckCircle,
  lucideCircleX,
  lucideCreditCard,
  lucidePhilippinePeso,
  lucidePrinter,
  lucidePrinterCheck,
  lucideRefreshCw,
  lucideRefreshCwOff,
  lucideSave,
  lucideSaveOff,
  lucideShoppingCart,
} from '@ng-icons/lucide';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { FormsModule } from '@angular/forms';
import { HlmLabel } from '../../../../../../../libs/ui/label/src/lib/hlm-label';
import { matDialpadOutline } from '@ng-icons/material-icons/outline';
import { ScannerService } from '../../../services/scanner-service';
import { ReceiptPrinterService } from '../../../services/receipt-printer-service';
import { toast } from '@spartan-ng/brain/sonner';
import { BrnDialogState } from '@spartan-ng/brain/dialog';
import { Router } from '@angular/router';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';

const itemBarcodes = [
  '4801520204635',
  '4805980928421',
  '4804686157111',
  '4803050568751',
  '4802740643785',
  '4801219239207',
];

export type ScanServiceFocusOptions = 'root' | 'cart-table-autocomplete';

export const CHECKOUT_AUTOSAVE_KEY = 'checkout-autosave';

@Component({
  selector: 'app-checkout',
  imports: [
    NgIcon,
    HlmIcon,
    HlmCheckboxImports,
    CartTable,
    HlmFieldImports,
    HlmAutocompleteImports,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmButton,
    HlmToggleImports,
    FormsModule,
    QuantityStepper,
    HlmLabel,
    HlmAlertDialogImports,
    HlmDialogImports,
    HlmInputGroupImports,
  ],
  viewProviders: [
    provideIcons({
      lucideSave,
      lucideSaveOff,
      lucideShoppingCart,
      lucideRefreshCw,
      matDialpadOutline,
      lucideRefreshCwOff,
      lucideCreditCard,
      lucidePhilippinePeso,
      lucideCircleX,
      lucidePrinter,
      lucidePrinterCheck,
      lucideCheckCircle,
    }),
  ],
  providers: [DecodeDbFloatPipe],
  templateUrl: './checkout.html',
  styles: ``,
  host: {
    '(window:blur)': 'onWindowBlur()',
    '(window:focus)': 'onWindowFocus()',
  },
})
export class Checkout implements OnInit, OnDestroy {
  private readonly dR = inject(DestroyRef);
  protected readonly dbFloatDecoder = inject(DecodeDbFloatPipe);

  protected readonly cartService = inject(CartService);
  protected readonly itemService = inject(ItemService);
  protected readonly printerService = inject(ReceiptPrinterService);
  private readonly storage = inject(StorageService);
  protected readonly banner = inject(BannerService);
  protected readonly scannerService = inject(ScannerService);
  protected readonly router = inject(Router);

  protected readonly scanServiceFocus = signal<ScanServiceFocusOptions>('root');
  protected readonly itemsToAddToCartDialogState = signal<BrnDialogState>('closed');

  private windowFocusMessageId: string | undefined;

  readonly resetItemQuantityOnNextScan = signal<boolean>(true);
  readonly itemQuantity = signal<number>(1);
  readonly autoSave = signal<'on' | 'off'>(this.storage.get(CHECKOUT_AUTOSAVE_KEY) ?? 'on');

  /*
    AUTOCOMPELTE/MANUAL ITEM SEARCH
  */
  readonly autocompleteSearchString = signal<string>('');
  readonly autocompleteOptions = toSignal(
    toObservable(this.autocompleteSearchString).pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((searchString) => {
        const query = searchString.trim();
        return this.itemService.search(query).pipe(map((response) => response?.data ?? []));
      }),
    ),
    { initialValue: [] },
  );
  readonly autocompleteSelectedId = signal<string | null | undefined>(null);

  readonly totalAmount = computed(() => {
    return Object.values(this.cartService.itemDetails()).reduce((sum, item) => {
      return sum + item.quantity * item.price;
    }, 0);
  });

  // private handleScannedBarcode(barcode: string): void {
  //   this.cartService.addCartItem({ barcode, quantity: this.itemQuantity() }).subscribe((added) => {
  //     if (!added) {
  //       this.banner.show({
  //         message: `Item ${barcode} not found.`,
  //         severity: 'warning',
  //       });
  //     }
  //     if (this.resetItemQuantityOnNextScan()) {
  //       this.itemQuantity.set(1);
  //     }
  //   });
  // }

  refreshCart() {
    const ids = this.cartService.itemOrder();
    if (ids.length === 0) return;

    this.itemService.getByIds(ids).subscribe({
      next: (res) => {
        if (res.status !== 200 || !res.data) return;

        const updated = res.data;
        const priceChanges: string[] = [];

        this.cartService.itemDetails.update((prev) => {
          const next = { ...prev };
          for (const id of ids) {
            const fresh = updated[id];
            const existing = prev[id];
            if (!fresh || !existing) continue;
            if (fresh.price !== existing.price) {
              priceChanges.push(fresh.name);
            }
            next[id] = { ...existing, ...fresh };
          }
          return next;
        });

        if (priceChanges.length > 0) {
          this.banner.show({
            message: `Prices updated: ${priceChanges.join(', ')}`,
            severity: 'warning',
            duration: 'long',
          });
        }
      },
      error: (err) => console.error(err),
    });
  }

  onWindowBlur(): void {
    this.windowFocusMessageId = this.banner.show({
      message: 'Window out of focus!',
      severity: 'error',
      duration: 0,
    });
  }

  onWindowFocus(): void {
    const focusId = this.windowFocusMessageId;
    if (focusId) this.banner.dismiss(focusId);
    this.windowFocusMessageId = undefined;
  }

  itemIdToName = (id: string): string => {
    return this.cartService.itemDetails()[id]?.name ?? id;
  };

  handleLoadItemsToAddToCart() {
    const items = this.storage.get<AddCartItemParams[]>('checkout-itemsToAddToCart');
    this.storage.remove('checkout-itemsToAddToCart');

    if (items?.length) {
      this.cartService.clearDraft();
      this.cartService.removeAllItems();
      items.forEach((item) => {
        this.cartService
          .addCartItem({ id: item.id, quantity: item.quantity })
          .pipe(takeUntilDestroyed(this.dR))
          .subscribe();
      });
    }
  }

  handleProceedToPayment() {
    this.cartService.moveCartToPayment();
    this.router.navigate(['/authenticated', 'payment']);
  }

  ngOnInit() {
    // if (environment.production === false && this.cartService.itemOrder().length === 0) {
    //   itemBarcodes.forEach((barcode) =>
    //     this.cartService
    //       .addCartItem({ barcode: barcode, quantity: faker.number.int({ min: 1, max: 10 }) })
    //       .subscribe(),
    //   );
    // }

    const autoSave = this.autoSave() === 'on';
    const draftExists = this.cartService.draftExists();

    if (this.storage.has('checkout-itemsToAddToCart')) {
      if (draftExists || this.cartService.itemOrder().length > 0) {
        this.itemsToAddToCartDialogState.set('open');
      } else {
        this.handleLoadItemsToAddToCart();
      }
    } else if (autoSave && draftExists) {
      this.cartService.moveDraftToCart();
      this.banner.show({ message: 'Loaded Saved Draft', duration: 'long', severity: 'success' });
    }
  }

  ngOnDestroy() {
    if (this.autoSave() === 'on' && this.cartService.itemOrder().length > 0) {
      this.cartService.moveCartToDraft();
      toast.success('Cart saved to Draft');
    }
  }

  constructor() {
    toObservable(this.autoSave)
      .pipe(
        skip(1), // Skip initial value
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((value) => {
        this.storage.set(CHECKOUT_AUTOSAVE_KEY, value);
      });

    effect(() => {
      const id = this.autocompleteSelectedId();
      if (id) {
        untracked(() =>
          this.cartService
            .addCartItem({ id, quantity: this.itemQuantity() })
            .pipe(takeUntilDestroyed(this.dR))
            .subscribe(() => {
              if (this.resetItemQuantityOnNextScan()) {
                this.itemQuantity.set(1);
              }
            }),
        );
      }
    });

    this.scannerService.dataStream$
      .pipe(
        takeUntilDestroyed(),
        filter(() => this.scanServiceFocus() === 'root'),
        mergeMap((data) => {
          let subj = null;
          const { prefix, plu, weight } = decodeEan13(data.barcode) ?? {};
          if (prefix && prefix === '2') {
            const parsedWeight = this.dbFloatDecoder.transform(weight ?? 0);
            subj = this.cartService.addCartItem({ plu, quantity: parsedWeight });
          } else {
            subj = this.cartService.addCartItem({
              barcode: data.barcode,
              quantity: this.itemQuantity(),
            });
          }
          subj = subj.pipe(map((response) => ({ response, data })));

          return subj;
        }),
      )
      .subscribe(({ response, data }) => {
        if (response.status === 404) {
          this.banner.show({
            message: `Item "${data.barcode}" not found.`,
            severity: 'warning',
          });
        } else if (response.status === 200) {
          if (this.resetItemQuantityOnNextScan()) {
            this.itemQuantity.set(1);
          }
        }
      });
  }
}
