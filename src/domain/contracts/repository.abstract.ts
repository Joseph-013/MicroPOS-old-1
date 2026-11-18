import { eq, and, isNull, desc, asc, type SQL, Query, inArray, isNotNull } from "drizzle-orm";
import { type SQLiteSelect, type SQLiteTable } from "drizzle-orm/sqlite-core";
import { type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { db } from "@config/database";
import {
  FilterValue,
  PaginationResponse,
  CursorPaginationResponse,
  PaginatedQueryOptions,
  CursorPaginationOptions,
  ApiResponse,
  SortConfig,
} from "@shared/src";
import { paginateQuery, paginateWithCursor } from "../../util/paginate-query";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "uuidv7";
import { nowISO } from "../../util/query-helpers";
import { parseSqliteError } from "../../util/sqlite-error-handler";
import { logger } from "@config/logger";
import { SortableColumns } from "../../types/sortable-columns";

export abstract class BaseRepository<
  TTable extends SQLiteTable<any>,
  TEntity extends Record<string, any>,
  TNewEntity extends Record<string, any> = Omit<TEntity, "id" | "createdAt" | "updatedAt" | "deletedAt">,
  TUpdateEntity extends Record<string, any> = Partial<Omit<TEntity, "id" | "createdAt" | "updatedAt" | "deletedAt">>,
  TFilters extends Record<string, FilterValue> = Record<string, any>,
  TSortField extends string = string,
> {
  protected readonly db: BetterSQLite3Database<any> = db;

  protected abstract readonly table: TTable;

  protected abstract readonly defaultSortConfig: SortConfig<TSortField>;

  protected abstract readonly fieldToLabelMap: Record<string, string>;

  protected abstract readonly sortableColumns: SortableColumns<TSortField>;

  protected resolveSortColumn(sortConfig: SortConfig<TSortField>): SQLiteColumn {
    const field = sortConfig.field as keyof typeof this.sortableColumns;
    const column = this.sortableColumns[field];
    if (!column) {
      throw new Error(`Invalid sort field: ${String(sortConfig.field)}`);
    }
    return column;
  }

  protected baseQuery(withDeleted?: boolean): SQLiteSelect {
    const base = this.db.select().from(this.table);

    if (!withDeleted && "deletedAt" in this.table) {
      return base.where(isNull((this.table as any).deletedAt)) as any;
    }

    return base as any;
  }

  protected applyFilters(query: SQLiteSelect, filters?: TFilters): SQLiteSelect {
    return query;
  }

  async getById(id: string, options?: { withDeleted?: boolean }): Promise<ApiResponse<TEntity>> {
    try {
      const includeDeleted = options?.withDeleted ?? false;

      const [result] = await this.baseQuery(includeDeleted)
        .where(eq((this.table as any).id, id))
        .limit(1);

      if (!result) {
        return { status: 404, error: { message: "Record not found." } as any };
      }

      return { status: 200, data: result as TEntity };
    } catch (error) {
      console.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async getAll(
    options?: PaginatedQueryOptions<TFilters, TSortField>,
  ): Promise<ApiResponse<PaginationResponse<TEntity[] | void>>> {
    try {
      let query = this.baseQuery().$dynamic();
      query = this.applyFilters(query, options?.filters);

      const activeSortConfig = options?.sort ?? this.defaultSortConfig;
      const sortColumn = this.resolveSortColumn(activeSortConfig);

      const response = await paginateQuery(query, {
        page: options?.page,
        perPage: options?.perPage,
        sortColumn,
        sortDirection: activeSortConfig.direction!,
      });
      return { status: 200, data: response };
    } catch (error) {
      logger.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async getAllDeleted(
    options?: PaginatedQueryOptions<TFilters, TSortField>,
  ): Promise<ApiResponse<PaginationResponse<TEntity[] | void>>> {
    try {
      let query = this.baseQuery(true).$dynamic();

      const deletedAtColumn = (this.table as any).deletedAt as SQLiteColumn | undefined;

      if (!deletedAtColumn) {
        throw new Error(`Entity table does not support soft deletion tracking.`);
      }
      query = query.where(isNotNull(deletedAtColumn));
      query = this.applyFilters(query, options?.filters);

      const activeSortConfig = options?.sort ?? this.defaultSortConfig;
      const sortColumn = this.resolveSortColumn(activeSortConfig);

      const response = await paginateQuery(query, {
        page: options?.page,
        perPage: options?.perPage,
        sortColumn,
        sortDirection: activeSortConfig.direction!,
      });
      return { status: 200, data: response };
    } catch (error) {
      logger.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async getAllCursor(
    options: CursorPaginationOptions<TFilters, TSortField>,
  ): Promise<ApiResponse<CursorPaginationResponse<TEntity>>> {
    try {
      let query = this.baseQuery().$dynamic();
      query = this.applyFilters(query, options?.filters);

      const activeSortConfig = options?.sort ?? this.defaultSortConfig;
      const sortColumn = this.resolveSortColumn(activeSortConfig);

      const result = await paginateWithCursor(query, {
        limit: options.limit,
        cursor: options.cursor,
        cursorField: (this.table as any).id as SQLiteColumn,
        sortColumn,
        sortDirection: activeSortConfig.direction!,
      });

      return {
        status: 200,
        data: result as unknown as CursorPaginationResponse<TEntity>,
      };
    } catch (error) {
      logger.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async create(payload: TNewEntity): Promise<ApiResponse<TEntity>> {
    try {
      const [result] = await this.db
        .insert(this.table)
        .values({
          id: uuidv7(),
          ...payload,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        } as any)
        .returning();

      return {
        status: 201,
        data: result as TEntity,
      };
    } catch (error) {
      console.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async update(id: string, payload: TUpdateEntity): Promise<ApiResponse<TEntity>> {
    try {
      const [result] = await this.db
        .update(this.table)
        .set({
          ...payload,
          updatedAt: nowISO(),
        } as any)
        .where(eq((this.table as any).id, id))
        .returning();

      if (!result) {
        return {
          status: 404,
          error: {
            message: "Record not found or no changes were made.",
          } as any,
        };
      }

      return {
        status: 200,
        data: result as TEntity,
      };
    } catch (error) {
      console.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async delete(param: string | string[]): Promise<ApiResponse<void>> {
    try {
      if (!("deletedAt" in this.table)) {
        throw new Error(`Table ${(this.table as any).name} does not support soft deletions.`);
      }

      const condition = Array.isArray(param)
        ? inArray((this.table as any).id, param)
        : eq((this.table as any).id, param);

      await this.db
        .update(this.table)
        .set({ deletedAt: nowISO() } as any)
        .where(condition);

      return { status: 200 };
    } catch (error) {
      console.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async forceDelete(param: string | string[]): Promise<ApiResponse<void>> {
    try {
      const condition = Array.isArray(param)
        ? inArray((this.table as any).id, param)
        : eq((this.table as any).id, param);

      await this.db.delete(this.table).where(condition);

      return { status: 200 };
    } catch (error) {
      console.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }

  async restore(param: string | string[]): Promise<ApiResponse<void>> {
    try {
      if (!("deletedAt" in this.table)) {
        throw new Error(`Table ${(this.table as any).name} does not support soft deletions.`);
      }

      const condition = Array.isArray(param)
        ? inArray((this.table as any).id, param)
        : eq((this.table as any).id, param);

      await this.db
        .update(this.table)
        .set({ deletedAt: null } as any)
        .where(condition);

      return { status: 200 };
    } catch (error) {
      console.error(error);
      return parseSqliteError(error, this.fieldToLabelMap);
    }
  }
}
