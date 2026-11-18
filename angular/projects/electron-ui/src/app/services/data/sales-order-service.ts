import { Service } from '@angular/core';
import { DataService } from './data-service.abstract';
import {
  ApiResponse,
  NewSalesOrder,
  SalesOrder,
  SalesOrderFilters,
  SalesOrderSortField,
} from '@micropos/shared/src';
import { DecodeDbFloatPipe, EncodeDbFloatPipe } from '@angular-shared';
import { from, map, Observable } from 'rxjs';

@Service()
export class SalesOrderService extends DataService<
  SalesOrder,
  NewSalesOrder,
  undefined,
  SalesOrderFilters,
  SalesOrderSortField
> {
  override entityName: string = 'sales-orders';
  private readonly dbFloatEncoder = new EncodeDbFloatPipe().transform;
  private readonly dbFloatDecoder = new DecodeDbFloatPipe().transform;

  protected override serialize(payload: NewSalesOrder): NewSalesOrder {
    return {
      ...payload,
      snapshotTotalAmount: this.dbFloatEncoder(payload.snapshotTotalAmount),
      amountTendered: this.dbFloatEncoder(payload.amountTendered),
      changeAmount: this.dbFloatEncoder(payload.changeAmount),
      items: payload.items.map((i) => ({ ...i, quantity: this.dbFloatEncoder(i.quantity) })),
    };
  }

  protected override deserialize(entity: SalesOrder): SalesOrder {
    return {
      ...entity,
      snapshotTotalAmount: this.dbFloatDecoder(entity.snapshotTotalAmount),
      amountTendered: this.dbFloatDecoder(entity.amountTendered),
      changeAmount: this.dbFloatDecoder(entity.changeAmount),
    };
  }

  getByOrderNumber(
    orderNumber: string,
    options?: { withDeleted?: boolean },
  ): Observable<ApiResponse<SalesOrder | undefined, any>> {
    return from(
      window.electronAPI.invoke<ApiResponse<SalesOrder | undefined>>(
        `${this.entityName}:getByOrderNumber`,
        {
          orderNumber,
          options,
        },
      ),
    ).pipe(
      map((res) => ({
        ...res,
        data: res.data ? this.deserialize(res.data) : undefined,
      })),
    );
  }

  // get(
  //   id: string,
  //   options?: { withDeleted?: boolean },
  // ): Observable<ApiResponse<TEntity | undefined>> {
  //   return from(
  //     window.electronAPI.invoke<ApiResponse<TEntity | undefined>>(`${this.entityName}:get`, {
  //       id,
  //       options,
  //     }),
  //   ).pipe(
  //     map((res) => ({
  //       ...res,
  //       data: res.data ? this.deserialize(res.data) : undefined,
  //     })),
  //   );
  // }
}
