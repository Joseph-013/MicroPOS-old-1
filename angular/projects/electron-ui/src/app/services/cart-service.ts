import { ActiveCheckoutItem, StorageService } from '@angular-shared';
import { computed, inject, Service, signal } from '@angular/core';
import { ItemService } from './data/item-service';
import { Item } from '@micropos/shared/src/domains';
import { map, Observable, of, Subject } from 'rxjs';
import { ApiResponse } from '@micropos/shared/src';
import { SettingsService } from '../../../../shared/src/lib/services/settings-service';

export interface CartDraft {
  order: Item['id'][];
  details: Record<string, ActiveCheckoutItem>;
}

export interface AddCartItemParams {
  id?: string;
  barcode?: string;
  plu?: string;
  item?: Item;
  quantity?: number;
}

export const DRAFT_KEY = 'checkout-draft';
export const PAYMENT_ITEMS_KEY = 'payment-items';

@Service()
export class CartService {
  readonly itemService = inject(ItemService);
  readonly itemOrder = signal<string[]>([]);
  readonly itemDetails = signal<Record<string, ActiveCheckoutItem>>({});
  readonly lastUpsertedItem = signal<Item | null>(null);
  private readonly storage = inject(StorageService);

  private readonly _upsertedItem = new Subject<string>();
  readonly onItemUpsert = this._upsertedItem.asObservable();

  readonly allItemsChecked = computed(() => {
    const items = Object.values(this.itemDetails());
    return items.length > 0 && items.every((i) => i.checked);
  });

  readonly someItemsChecked = computed(() => {
    const items = Object.values(this.itemDetails());
    return items.some((i) => i.checked) && !this.allItemsChecked();
  });

  readonly checkedItemIds = computed(() =>
    this.itemOrder()?.filter((itemId) => this.itemDetails()?.[itemId]?.checked),
  );

  readonly subTotal = computed(() => {
    let total = 0;
    for (const id of this.itemOrder()) {
      const item = this.itemDetails()[id];
      if (item) {
        total += item.quantity * item.price;
      }
    }
    return total;
  });

  addCartItem(params: AddCartItemParams): Observable<ApiResponse<Item>> {
    const id: string | undefined = params.id || params?.item?.id;
    const barcode: string | undefined = params.barcode || params?.item?.barcode || undefined;
    const plu: string | undefined = params.plu || params?.item?.plu || undefined;
    const quantity = params.quantity ?? 1;

    if (!id && !barcode && !plu) {
      return of({ status: 400, error: 'Missing identifier: provide id, barcode, or plu' });
    }

    let source$ = null;

    // const source$ = id ? this.itemService.get(id) : this.itemService.getByBarcode(barcode!);
    if (id) source$ = this.itemService.get(id);
    else if (barcode) source$ = this.itemService.getByBarcode(barcode);
    else if (plu) source$ = this.itemService.getByPlu(plu);

    return source$!.pipe(
      map((response) => {
        const item = response.data;
        if (!item) {
          return { status: 404, error: `Item not found` } as ApiResponse<Item>;
        }

        this.itemOrder.update((currentItemOrder) => {
          const itemId = item.id;
          if (currentItemOrder.includes(itemId)) {
            return [...currentItemOrder.filter((i) => i !== itemId), itemId];
          }
          return [...currentItemOrder, itemId];
        });

        this.itemDetails.update((currentItemDetails) => {
          const existingItem = currentItemDetails[item.id];
          return {
            ...currentItemDetails,
            [item.id]: {
              ...item,
              quantity: existingItem ? existingItem.quantity + quantity : quantity,
              checked: false,
            },
          };
        });

        this.lastUpsertedItem.set(item);
        this._upsertedItem.next(item.id);

        return { status: 200, data: item } as ApiResponse<Item>;
      }),
    );
  }

  moveCartToPayment() {
    this.storage.set(PAYMENT_ITEMS_KEY, {
      order: this.itemOrder(),
      details: this.itemDetails(),
    });
    this.removeAllItems();
  }

  movePaymentToCart() {
    if (!this.storage.has(PAYMENT_ITEMS_KEY)) return;
    const { order, details } = this.storage.get<{
      order: string[];
      details: Record<string, ActiveCheckoutItem>;
    }>(PAYMENT_ITEMS_KEY)!;
    this.itemOrder.set(order);
    this.itemDetails.set(details);
    this.storage.remove(PAYMENT_ITEMS_KEY);
  }

  moveCartToDraft() {
    this.storage.set<CartDraft>(DRAFT_KEY, {
      order: this.itemOrder(),
      details: this.itemDetails(),
    });
    this.removeAllItems();
  }

  moveDraftToCart() {
    const draft = this.storage.get<CartDraft>(DRAFT_KEY);
    this.itemOrder.set(draft?.order ?? []);
    this.itemDetails.set(draft?.details ?? {});
    this.clearDraft();
  }

  clearDraft() {
    this.storage.remove(DRAFT_KEY);
  }

  clearPaymentItems() {
    this.storage.remove(PAYMENT_ITEMS_KEY);
  }

  draftExists(): boolean {
    return this.storage.has(DRAFT_KEY);
  }

  searchItemInCart(searchString: string): ActiveCheckoutItem[] {
    const query = searchString.trim().toLowerCase();
    if (!query) return [];

    return this.itemOrder()
      .map((id) => this.itemDetails()[id])
      .filter((item): item is ActiveCheckoutItem => !!item)
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.barcode?.toLowerCase().includes(query) ||
          item.plu?.toLowerCase().includes(query) ||
          item.sku?.toLowerCase().includes(query),
      );
  }

  toggleAllItemsCheck(value?: boolean) {
    const resolvedValue = value !== undefined ? value : !this.allItemsChecked();
    this.itemDetails.update((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([key, val]) => [key, { ...val, checked: resolvedValue }]),
      ),
    );
  }

  toggleItemCheck(id: string, value: boolean) {
    this.itemDetails.update((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: value },
    }));
  }

  removeItem(id: string) {
    this.itemOrder.update((prev) => prev.filter((i) => i !== id));
    this.itemDetails.update((prev) => {
      const { [id]: _, ...remaining } = prev;
      return remaining;
    });
  }

  removeSelectedItems() {
    this.itemDetails.update((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([_, value]) => !value.checked)),
    );
    this.itemOrder.update((prev) => prev.filter((id) => this.itemDetails()[id] !== undefined));
  }

  removeAllItems() {
    this.itemOrder.set([]);
    this.itemDetails.set({});
  }
}
