import {
  NewSalesOrderItem,
  SalesOrder,
  SalesOrderItem,
  salesOrderItems,
  SalesOrderItemSortableColumns,
  UpdateSalesOrderItem,
} from "@db/schema";
import { BaseRepository } from "../contracts/repository.abstract";
import {
  ApiResponse,
  SALES_ORDER_ITEM_LABEL_MAP,
  SalesOrderItemFilters,
  SalesOrderItemSortField,
  SortConfig,
} from "@shared/src";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { parseSqliteError } from "../../util/sqlite-error-handler";
import { eq } from "drizzle-orm";
import { SortableColumns } from "../../types/sortable-columns";

export class SalesOrderItemRepository extends BaseRepository<
  typeof salesOrderItems,
  SalesOrderItem,
  NewSalesOrderItem,
  UpdateSalesOrderItem,
  SalesOrderItemFilters,
  SalesOrderItemSortField
> {
  protected override table = salesOrderItems;
  protected override defaultSortConfig: SortConfig<SalesOrderItemSortField> = {
    field: "createdAt",
    direction: "desc",
  };
  protected override fieldToLabelMap: Record<string, string> = SALES_ORDER_ITEM_LABEL_MAP;
  protected override sortableColumns: SortableColumns<SalesOrderItemSortField> = SalesOrderItemSortableColumns;

  async getBySalesOrderId(salesOrderId: SalesOrder["id"]): Promise<ApiResponse<SalesOrderItem[]>> {
    try {
      const query = this.baseQuery();
      const result = await query.where(eq(salesOrderItems.salesOrderId, salesOrderId));
      return { status: 200, data: result as SalesOrderItem[] };
    } catch (error) {
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }
}

export const salesOrderItemRepository = new SalesOrderItemRepository();
