import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { ActiveCheckoutItem, QuantityStepper } from '@angular-shared';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShoppingCart, lucideX } from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { CartService } from '../../../../../services/cart-service';
import { HlmAutocompleteImports, HlmAutocompleteInput } from '@spartan-ng/helm/autocomplete';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { ScanServiceFocusOptions } from '../../checkout';
import { ScannerService } from '../../../../../services/scanner-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { PriceModeUnitMap } from '../../../../../services/data/item-service';

@Component({
  selector: 'app-cart-table',
  imports: [
    HlmTableImports,
    HlmCheckboxImports,
    NgIcon,
    HlmIcon,
    HlmAutocompleteImports,
    HlmAlertDialogImports,
    HlmDialogImports,
    HlmFieldImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmContextMenuImports,
    QuantityStepper,
    DatePipe,
    CurrencyPipe,
  ],
  viewProviders: [provideIcons({ lucideShoppingCart, lucideX })],
  templateUrl: './cart-table.html',
  styleUrl: './cart-table.css',
})
export class CartTable {
  private readonly scrollContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('scrollContainer');

  private readonly cartAutocomplete = viewChild<HlmAutocompleteInput>('cartAutocomplete');

  protected readonly PriceModeUnitMap = PriceModeUnitMap;

  readonly cartService = inject(CartService);
  readonly selectedItem = model<ActiveCheckoutItem | null>(null);
  readonly highlightItemId = signal<string | null>(null);
  readonly pendingNewQuantity = signal<number | undefined>(undefined);

  readonly scannerService = inject(ScannerService);
  readonly scanServiceFocus = model<ScanServiceFocusOptions>();

  /*
    CART AUTOCOMPELTE ITEM SEARCH THROUGH CART
  */
  readonly cartAutocompleteSearchString = signal<string>('');
  readonly cartAutocompleteOptions = computed(() =>
    this.cartService.searchItemInCart(this.cartAutocompleteSearchString()),
  );
  readonly cartAutocompleteSelectedId = signal<string | null | undefined>(null);

  /*
    DIALOG STATES
  */
  readonly editItemDialog = signal<BrnDialogState>('closed');
  readonly deleteItemDialog = signal<BrnDialogState>('closed');

  /** Scrolls table to a row item via item id */
  scrollToItem(id: string): void {
    setTimeout(() => {
      const container = this.scrollContainer().nativeElement;
      const row = container.querySelector<HTMLElement>(`[data-item-id="${id}"]`);
      const header = container.querySelector<HTMLElement>('thead');

      if (row) {
        const headerHeight = header?.offsetHeight ?? 0;
        const rowTop = row.offsetTop;
        this.highlightItemId.set(id);

        container.scrollTo({
          top: rowTop - headerHeight,
          behavior: 'smooth',
        });
      }
    }, 150);
  }

  /** Scrolls table to bottom edge */
  scrollToBottom() {
    setTimeout(() => {
      const container = this.scrollContainer();
      if (container) {
        container.nativeElement.scrollTo({
          top: container.nativeElement.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 0);
  }

  /** When autocomplete item is selected, change display string to item name */
  itemIdToName = (id: string): string => {
    return this.cartService.itemDetails()[id]?.name ?? id;
  };

  /*
    HIGHLIGHTING MECHANIC
  */
  private highlightTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private highlightResetId: ReturnType<typeof setTimeout> | null = null;
  setItemIdHighlight(id: string): void {
    if (this.highlightTimeoutId) {
      clearTimeout(this.highlightTimeoutId);
      this.highlightTimeoutId = null;
    }
    if (this.highlightResetId) {
      clearTimeout(this.highlightResetId);
      this.highlightResetId = null;
    }

    this.highlightItemId.set(null);

    this.highlightTimeoutId = setTimeout(() => {
      this.highlightItemId.set(id);

      this.highlightResetId = setTimeout(() => {
        if (this.highlightItemId() === id) {
          this.highlightItemId.set(null);
        }
      }, 2000);
    }, 0);
  }

  openEditItemDialog(item: ActiveCheckoutItem) {
    this.selectedItem.set(item);
    this.pendingNewQuantity.set(this.selectedItem()!.quantity);
    this.editItemDialog.set('open');
  }

  applyEditItem(targetItemId: string, newItemDetails: Partial<ActiveCheckoutItem>) {
    const { quantity } = newItemDetails;
    this.cartService.itemDetails.update((prev) => {
      const targetItem = prev[targetItemId];
      return {
        ...prev,
        [targetItemId]: {
          ...targetItem,
          quantity: quantity ?? targetItem.quantity,
        },
      };
    });
  }

  itemEntries(item: ActiveCheckoutItem) {
    return Object.entries(item).map(([key, value]) => ({
      key,
      value,
    }));
  }

  ngOnDestroy(): void {
    if (this.highlightTimeoutId) clearTimeout(this.highlightTimeoutId);
    if (this.highlightResetId) clearTimeout(this.highlightResetId);
  }

  handleCartAutocompleteFocus() {
    this.scanServiceFocus.set('cart-table-autocomplete');
  }

  handleCartAutocompleteBlur() {
    this.scanServiceFocus.set('root');
  }

  constructor() {
    this.cartService.onItemUpsert.subscribe((id: string) => {
      this.setItemIdHighlight(id);
      this.scrollToItem(id);
    });

    effect(() => {
      const id = this.cartAutocompleteSelectedId();
      if (id) {
        this.scrollToItem(id);
        this.cartAutocompleteSelectedId.set(null);
      }
    });

    this.scannerService.dataStream$
      .pipe(
        takeUntilDestroyed(),
        filter(() => this.scanServiceFocus() === 'cart-table-autocomplete'),
      )
      .subscribe(({ barcode }) => {
        this.cartAutocomplete()?.pasteValue(barcode);
      });
  }
}
