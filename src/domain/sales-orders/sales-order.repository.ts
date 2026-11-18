import {
  items,
  SalesOrder,
  SalesOrderItem,
  salesOrderItems,
  salesOrders,
  SalesOrderSortableColumns,
  UpdateSalesOrder,
} from "@db/schema";
import { BaseRepository } from "../contracts/repository.abstract";
import {
  ApiResponse,
  NewSalesOrder,
  SALES_ORDER_LABEL_MAP,
  SalesOrderFilters,
  SalesOrderSortField,
  SortConfig,
} from "@shared/src";
import { SQLiteSelect } from "drizzle-orm/sqlite-core";
import { eq, inArray, isNull, like, sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { parseSqliteError } from "../../util/sqlite-error-handler";
import { SortableColumns } from "../../types/sortable-columns";
import { customAlphabet } from "nanoid";

const generateReceiptToken = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 5);

export class SalesOrderRepository extends BaseRepository<
  typeof salesOrders,
  SalesOrder,
  NewSalesOrder,
  UpdateSalesOrder,
  SalesOrderFilters,
  SalesOrderSortField
> {
  protected override table = salesOrders;
  protected override defaultSortConfig: SortConfig<SalesOrderSortField> = {
    field: "createdAt",
    direction: "desc",
  };
  protected override fieldToLabelMap: Record<string, string> = SALES_ORDER_LABEL_MAP;

  protected override sortableColumns: SortableColumns<SalesOrderSortField> = SalesOrderSortableColumns;

  protected override baseQuery(withDeleted?: boolean): SQLiteSelect {
    const base = this.db
      .select({
        id: salesOrders.id,
        orderNumber: salesOrders.orderNumber,
        snapshotTotalAmount: salesOrders.snapshotTotalAmount,
        amountTendered: salesOrders.amountTendered,
        changeAmount: salesOrders.changeAmount,
        createdAt: salesOrders.createdAt,
        updatedAt: salesOrders.updatedAt,
        deletedAt: salesOrders.deletedAt,
      })
      .from(salesOrders);

    if (!withDeleted) {
      return base.where(isNull(salesOrders.deletedAt)) as any;
    }

    return base as any;
  }

  protected override applyFilters(query: SQLiteSelect, filters?: SalesOrderFilters | undefined): SQLiteSelect {
    if (filters?.orderNumber) {
      const wildcardSearch = `%${filters.orderNumber}%`;
      query = query.where(like(salesOrders.orderNumber, wildcardSearch));
    }

    return query;
  }

  private generateRandomOrderNumber(datePrefix: string): string {
    const randomToken = generateReceiptToken();
    return `SO-${datePrefix}-${randomToken}`;
  }

  async getByOrderNumber(orderNumber: string, options?: { withDeleted?: boolean }): Promise<ApiResponse<SalesOrder>> {
    try {
      const includeDeleted = options?.withDeleted ?? false;

      const [result] = await this.baseQuery(includeDeleted)
        .where(eq((this.table as any).orderNumber, orderNumber))
        .limit(1);

      if (!result) {
        return { status: 404, error: { message: "Record not found." } as any };
      }

      return { status: 200, data: result as SalesOrder };
    } catch (error) {
      console.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  override async create(payload: NewSalesOrder): Promise<ApiResponse<SalesOrder>> {
    // We break execution out into an internal retry wrapper to isolate collision catch logic cleanly
    return this.executeCreateWithRetry(payload);
  }

  private async executeCreateWithRetry(payload: NewSalesOrder, retryCount = 0): Promise<ApiResponse<SalesOrder>> {
    // Fail-safe circuit breaker to prevent an infinite stack overflow loop if the database gets filled
    if (retryCount > 5) {
      return {
        status: 409,
        error: {
          message: "Failed to allocate a unique order number string after multiple attempts.",
          field: "orderNumber",
        },
      };
    }

    try {
      const now = new Date();
      const nowISO = now.toISOString();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const datePrefix = `${year}${month}${day}`;

      const { items: incomingItems, ...salesOrderPayload } = payload;

      const computedOrderNumber = this.generateRandomOrderNumber(datePrefix);

      const result = this.db.transaction((tx) => {
        const itemIds = incomingItems.map((i) => i.itemId);

        if (itemIds.length === 0) {
          throw new Error("Cannot create a sales order with zero items.");
        }

        const fetchedItems = tx.select().from(items).where(inArray(items.id, itemIds)).all();
        const itemMap = new Map(fetchedItems.map((item) => [item.id, item]));

        const parentOrderId = uuidv7();

        const itemsRows = incomingItems.map((incomingItem) => {
          const dbItem = itemMap.get(incomingItem.itemId);
          if (!dbItem) {
            throw new Error(`Item verification failed for ID: ${incomingItem.itemId}`);
          }

          return {
            id: uuidv7(),
            salesOrderId: parentOrderId,
            itemId: incomingItem.itemId,
            quantity: incomingItem.quantity,
            snapshotName: dbItem.name,
            snapshotPrice: dbItem.price,
          };
        });

        const [salesOrderResult] = tx
          .insert(this.table)
          .values({
            ...salesOrderPayload,
            id: parentOrderId,
            orderNumber: computedOrderNumber,
            snapshotTotalAmount: payload.snapshotTotalAmount,
            createdAt: nowISO,
            updatedAt: nowISO,
            deletedAt: null,
          } as any)
          .returning()
          .all();

        const salesOrderItemsResult = tx.insert(salesOrderItems).values(itemsRows).returning().all();

        return { ...salesOrderResult, salesOrderItems: salesOrderItemsResult };
      });

      return {
        status: 201,
        data: result,
      };
    } catch (error: any) {
      // 🌟 Catch conflicts at the entry barrier. If it's a unique key collision, roll over and try again!
      const isUniqueCollision =
        error?.message?.includes("UNIQUE constraint failed") || error?.code === "SQLITE_CONSTRAINT_UNIQUE";
      const isOrderNumberField = error?.message?.includes("order_number") || error?.message?.includes("orderNumber");

      if (isUniqueCollision && isOrderNumberField) {
        // Re-invoke creation with a fresh code sequence token
        return this.executeCreateWithRetry(payload, retryCount + 1);
      }

      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async getByIdWithSalesOrderItems(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<ApiResponse<SalesOrder & { salesOrderItems: SalesOrderItem[] }>> {
    try {
      const includeDeleted = options?.withDeleted ?? false;

      let query = this.baseQuery().$dynamic();

      const [order] = await query.where(eq(this.table.id, id)).execute();

      if (!order) {
        return { status: 404, error: `Sales order with ID ${id} was not found.` };
      }

      const items = await this.db
        .select()
        .from(salesOrderItems)
        .where(eq(salesOrderItems.salesOrderId, order.id))
        .execute();

      const responseData = {
        ...order,
        salesOrderItems: items,
      } as SalesOrder & { salesOrderItems: SalesOrderItem[] };

      return {
        status: 200,
        data: responseData,
      };
    } catch (error) {
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }
}

export const salesOrderRepository = new SalesOrderRepository();
