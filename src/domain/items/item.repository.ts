import { Item, items, ItemSortableColumns, NewItem, UpdateItem } from "@db/schema";
import { BaseRepository } from "../contracts/repository.abstract";
import {
  ApiResponse,
  decodeEan13,
  ITEM_LABEL_MAP,
  ItemFilters,
  ItemSortField,
  PaginatedQueryOptions,
  SortConfig,
} from "@shared/src";
import { SQLiteColumn, SQLiteSelect } from "drizzle-orm/sqlite-core";
import { asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { parseSqliteError } from "../../util/sqlite-error-handler";
import { SortableColumns } from "../../types/sortable-columns";

export class ItemRepository extends BaseRepository<
  typeof items,
  Item,
  NewItem,
  UpdateItem,
  ItemFilters,
  ItemSortField
> {
  protected override table = items;
  protected override defaultSortConfig: SortConfig<ItemSortField> = {
    field: "createdAt",
    direction: "desc",
  };
  protected override fieldToLabelMap: Record<string, string> = ITEM_LABEL_MAP;
  protected override sortableColumns: SortableColumns<ItemSortField> = ItemSortableColumns;

  protected override applyFilters(query: SQLiteSelect, filters?: ItemFilters | undefined): SQLiteSelect {
    if (!filters) return query;

    // 1. Structural Global Wildcard Search Matcher
    if (filters.search) {
      const wildcardSearch = `%${filters.search}%`;

      query = query.where(
        or(
          like(items.name, wildcardSearch),
          like(items.barcode, wildcardSearch),
          like(items.plu, wildcardSearch),
          like(items.sku, wildcardSearch),
        ),
      );
    }

    // // 2. Structural Column Filters (e.g., handling numeric boundary predicates)
    // if (filters.price?.gte !== undefined) {
    //   query.where(gte(items.price, filters.price.gte));
    // }

    // if (filters.price?.lte !== undefined) {
    //   query.where(lte(items.price, filters.price.lte));
    // }

    return query;
  }

  async search(searchString: string, max: number = 10): Promise<ApiResponse<Item[]>> {
    try {
      if (!searchString?.trim()) {
        return { status: 200, data: [] };
      }

      let query = this.baseQuery().$dynamic();

      query = this.applyFilters(query, { search: searchString });

      query = query.limit(max);
      const result = await query;
      return {
        status: 200,
        data: result as Item[],
      };
    } catch (error) {
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async getByBarcode(barcode: string, options?: { withDeleted?: boolean }): Promise<ApiResponse<Item>> {
    const decoded = decodeEan13(barcode);
    const isPrefix2 = decoded && decoded.prefix === "2";
    try {
      const query = this.baseQuery(options?.withDeleted);

      const [result] = isPrefix2
        ? await query.where(eq(items.plu, decoded.plu))
        : await query.where(eq(items.barcode, barcode));

      if (!result) {
        return {
          status: 404,
          error: {
            message: `No item found matching barcode "${barcode}".`,
          } as any,
        };
      }

      return {
        status: 200,
        data: result as Item,
      };
    } catch (error) {
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async getByPlu(plu: string, options?: { withDeleted?: boolean }): Promise<ApiResponse<Item>> {
    try {
      const query = this.baseQuery(options?.withDeleted);

      const [result] = await query.where(eq(items.plu, plu));

      if (!result) {
        return {
          status: 404,
          error: {
            message: `No item found matching plu "${plu}".`,
          } as any,
        };
      }

      return {
        status: 200,
        data: result as Item,
      };
    } catch (error) {
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async getNextAvailablePlu(): Promise<ApiResponse<string>> {
    try {
      const nextPlu = await this.findNextAvailablePlu();

      return { status: 200, data: nextPlu };
    } catch (error) {
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  private async findNextAvailablePlu(): Promise<string> {
    const result = await this.db
      .select({
        gap: sql<number>`MIN(CAST(t1.plu AS INTEGER)) + 1`,
      })
      .from(sql`${items} t1`)
      .where(
        sql`NOT EXISTS (
        SELECT 1 
        FROM ${items} t2 
        WHERE CAST(t2.plu AS INTEGER) = CAST(t1.plu AS INTEGER) + 1
      )`,
      )
      .get();

    const nextPlu = result?.gap ?? 1;
    const formattedPlu = nextPlu.toString().padStart(5, "0");

    return formattedPlu;
  }

  async getByIds(ids: string[], options?: { withDeleted?: boolean }): Promise<ApiResponse<Record<string, Item>>> {
    try {
      if (!ids || ids.length === 0) {
        return { status: 200, data: {} };
      }

      const query = this.baseQuery(options?.withDeleted);

      const rows = await query.where(inArray((this.table as any).id, ids));

      const data = (rows as Item[]).reduce<Record<string, Item>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      return {
        status: 200,
        data,
      };
    } catch (error) {
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }
}

export const itemRepository = new ItemRepository();
