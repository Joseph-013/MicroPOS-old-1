import { SortDirection } from "./db-query.types";
import { FilterValue } from "./filter.types";

/*
  =========================================
  CORE FILTER PRIMITIVES
  =========================================
*/

/**
 * Handles numeric boundary boundaries for stock levels, amounts, or prices.
 */
// export type NumericFilter = {
//   eq?: number; // Equals
//   gt?: number; // Greater Than
//   lt?: number; // Less Than
//   gte?: number; // Greater Than or Equal
//   lte?: number; // Less Than or Equal
// };

// /**
//  * Handles ISO timestamp boundaries for cash shifts, orders, or audits.
//  */
// export type DateRangeFilter = {
//   startISO?: string;
//   endISO?: string;
// };

// export type SearchFilter = {
//   search?: any;
// };

// /**
//  * Combines all filter types into a flexible union.
//  * Replaces your legacy string-only 'FilterConfig'.
//  */
// export type FilterValue = string | number | boolean | NumericFilter | DateRangeFilter | SearchFilter | string[];

/*
  =========================================
  OFFSET-BASED PAGINATION
  =========================================
*/

export type PaginationOptions = {
  page?: number;
  perPage?: number;
};

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginationResponse<T> = {
  meta: PaginationMeta;
  data: T[];
};

export type PaginatedQueryOptions<
  TFilter extends Record<string, FilterValue> = Record<string, any>,
  TSortField extends string = string,
> = PaginationOptions & {
  sort?: SortConfig<TSortField>;
  filters?: TFilter;
};

export type SortConfig<TSortField = string> = {
  field: TSortField;
  direction?: SortDirection;
};

/*
  =========================================
  CURSOR-BASED PAGINATION
  =========================================
*/

export interface CursorPaginationOptions<
  TFilter extends Record<string, FilterValue> = Record<string, any>,
  TSortField extends string = string,
> {
  limit: number;
  cursor?: string;
  direction?: "asc" | "desc";
  orderBy?: TSortField;
  search?: string;
  filters?: TFilter;
  sort?: {
    field: TSortField;
    direction: "asc" | "desc";
  };
}

export interface CursorPaginationResponse<T> {
  data: T[];
  nextCursor: string | undefined;
  hasMore: boolean;
}
