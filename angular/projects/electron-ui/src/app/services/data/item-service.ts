import { Service } from '@angular/core';
import { from, Observable } from 'rxjs';
import { ApiResponse } from '@micropos/shared/src/ipc-types';
import {
  Item,
  ItemFilters,
  ItemSortField,
  NewItem,
  UpdateItem,
} from '@micropos/shared/src/domains';

import { DataService } from './data-service.abstract';
import { DecodeDbFloatPipe, EncodeDbFloatPipe } from '@angular-shared';

export const PRICE_MODES: readonly string[] = [
  'fixed',
  'embedded',
  'per_kg',
  'per_g',
  'per_m',
  'per_in',
  'per_lit',
  'per_ml',
  'per_pack',
] as const;

export const PriceModeUnitMap: Record<Partial<PriceMode>, string> = {
  per_kg: 'kg',
  per_g: 'g',
  per_m: 'mtr',
  per_in: 'in',
  per_lit: 'L',
  per_ml: 'mL',
  per_pack: 'pck',
};

export type PriceMode = (typeof PRICE_MODES)[number];

export const PRICE_MODE_TO_LABEL_MAP: Record<PriceMode, string> = {
  fixed: 'Fixed',
  embedded: 'Embedded',
  per_kg: 'Per Kilogram',
  per_g: 'Per Gram',
  per_m: 'Per Meter',
  per_in: 'Per Inch',
  per_lit: 'Per Liter',
  per_ml: 'Per Milliliter',
  per_pack: 'Per Pack',
};

export const PRICE_MODE_OPTIONS: readonly { label: string; value: PriceMode }[] = PRICE_MODES.map(
  (mode) => ({
    label: PRICE_MODE_TO_LABEL_MAP[mode],
    value: mode,
  }),
);

@Service()
export class ItemService extends DataService<
  Item,
  NewItem,
  UpdateItem,
  ItemFilters,
  ItemSortField
> {
  override entityName: string = 'items';
  private readonly dbFloatEncoder = new EncodeDbFloatPipe().transform;
  private readonly dbFloatDecoder = new DecodeDbFloatPipe().transform;

  protected override serialize(payload: NewItem | Partial<NewItem>) {
    return {
      ...payload,
      ...(payload.price !== undefined && { price: this.dbFloatEncoder(payload.price) }),
    };
  }

  protected override deserialize(entity: Item): Item {
    return {
      ...entity,
      price: this.dbFloatDecoder(entity.price),
    };
  }

  search(searchString: string): Observable<ApiResponse<Item[]>> {
    return from(window.electronAPI.invoke<ApiResponse<Item[]>>('items:search', searchString));
  }

  getByBarcode(barcode: string): Observable<ApiResponse<Item | undefined>> {
    return from(
      window.electronAPI.invoke<ApiResponse<Item | undefined>>('items:getByBarcode', barcode),
    );
  }

  getByPlu(plu: string): Observable<ApiResponse<Item | undefined>> {
    return from(window.electronAPI.invoke<ApiResponse<Item | undefined>>('items:getByPlu', plu));
  }

  getByIds(ids: string[]): Observable<ApiResponse<Record<string, Item>>> {
    return from(
      window.electronAPI.invoke<ApiResponse<Record<string, Item>>>('items:getByIds', ids),
    );
  }
}
