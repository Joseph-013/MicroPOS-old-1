import { Service } from '@angular/core';
import { DataService } from './data-service.abstract';
import {
  ApiResponse,
  NewSalesOrderItem,
  SalesOrder,
  SalesOrderItem,
  SalesOrderItemFilters,
  SalesOrderItemSortField,
  UpdateSalesOrderItem,
} from '@micropos/shared/src';
import { from, map, Observable } from 'rxjs';
import { DecodeDbFloatPipe, EncodeDbFloatPipe } from '@angular-shared';

@Service()
export class SalesOrderItemService extends DataService<
  SalesOrderItem,
  NewSalesOrderItem,
  UpdateSalesOrderItem,
  SalesOrderItemFilters,
  SalesOrderItemSortField
> {
  override entityName: string = 'sales-order-items';
  private readonly dbFloatEncoder = new EncodeDbFloatPipe().transform;
  private readonly dbFloatDecoder = new DecodeDbFloatPipe().transform;

  protected override deserialize(entity: SalesOrderItem): SalesOrderItem {
    return {
      ...entity,
      quantity: this.dbFloatDecoder(entity.quantity),
      snapshotPrice: this.dbFloatDecoder(entity.snapshotPrice),
    };
  }

  getBySalesOrderId(salesOrderId: SalesOrder['id']): Observable<ApiResponse<SalesOrderItem[]>> {
    return from(
      window.electronAPI.invoke<ApiResponse<SalesOrderItem[]>>(
        `${this.entityName}:getBySalesOrderId`,
        salesOrderId,
      ),
    ).pipe(
      map((res) => {
        if (!res.data || res.status !== 200) {
          return res;
        }

        return {
          ...res,
          data: res.data.map((s) => this.deserialize(s)),
        };
      }),
    );
  }
}
