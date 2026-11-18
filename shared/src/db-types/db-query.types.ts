export type SortDirection = "asc" | "desc";

export type QueryResult<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type QueryErrorResult = {
  success: false;
  error: string;
  details?: unknown;
};

export type QuerySuccessResult<T> = {
  success: true;
  data: T;
};

export type QueryResponse<T> = QuerySuccessResult<T> | QueryErrorResult;

export type RepositoryFindByIdOptions = {
  throwIfNotFound?: boolean;
};

export type SoftDeleteOptions = {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
};

export type TimestampFields = {
  created_at: string;
};

export type BaseEntity<ID = string> = TimestampFields & {
  id: ID;
};

export type SearchableFields<T> = Array<keyof T & string>;

export type SortableFields<T> = Array<keyof T & string>;

// export type DateRangeFilter = {
//   from?: string;
//   to?: string;
// };
