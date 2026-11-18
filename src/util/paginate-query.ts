import { count, gt, lt, desc, asc, type SQL, sql } from "drizzle-orm";
import { db } from "@config/database";
import { CursorPaginationResponse, PaginationResponse, SortConfig, SortDirection } from "@shared/src";
import type { SQLiteSelect } from "drizzle-orm/sqlite-core";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { SQLiteTable } from "drizzle-orm/sqlite-core";

/**
 * 1. OFFSET-BASED PAGINATION
 */
export async function paginateQuery<TSelect extends SQLiteSelect>(
  query: TSelect,
  options: {
    page?: number;
    perPage?: number;
    sortColumn: SQLiteColumn;
    sortDirection: "asc" | "desc";
  },
): Promise<PaginationResponse<any>> {
  const { page = 1, perPage = 10, sortColumn, sortDirection } = options;
  const offset = (page - 1) * perPage;

  const orderModifier = sortDirection === "desc" ? desc(sortColumn) : asc(sortColumn);

  const sortedQuery = query.orderBy(orderModifier);

  const sq = sortedQuery.as("subquery");
  const [totalResult] = await db.select({ total: count() }).from(sq);
  const total = totalResult?.total ?? 0;

  const data = await sortedQuery.limit(perPage).offset(offset);

  return {
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      hasNextPage: page * perPage < total,
      hasPreviousPage: page > 1,
    },
    data,
  };
}

/**
 * 2. CURSOR-BASED PAGINATION
 */
export async function paginateWithCursor<TSelect extends SQLiteSelect>(
  query: TSelect,
  options: {
    limit?: number;
    cursor?: string;
    cursorField: SQLiteColumn;
    sortColumn: SQLiteColumn;
    sortDirection: "asc" | "desc";
  },
): Promise<CursorPaginationResponse<any>> {
  const { limit = 10, cursor, cursorField, sortColumn, sortDirection } = options;

  const orderModifier = sortDirection === "desc" ? desc(sortColumn) : asc(sortColumn);

  let queryBuilder = query.orderBy(orderModifier);

  if (cursor) {
    queryBuilder = queryBuilder.where(gt(cursorField, cursor));
  }

  const data = await queryBuilder.limit(limit + 1);

  const hasMore = data.length > limit;
  const items = data.slice(0, limit);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return {
    data: items,
    nextCursor,
    hasMore,
  };
}
