export type NumericFilter = {
  eq?: number; // Equals
  gt?: number; // Greater Than
  lt?: number; // Less Than
  gte?: number; // Greater Than or Equal
  lte?: number; // Less Than or Equal
};

/**
 * Handles ISO timestamp boundaries for cash shifts, orders, or audits.
 */
export type DateRangeFilter = {
  startISO?: string;
  endISO?: string;
};

export type SearchFilter = {
  search?: any;
};

/**
 * Combines all filter types into a flexible union.
 * Replaces your legacy string-only 'FilterConfig'.
 */
export type FilterValue = string | number | boolean | NumericFilter | DateRangeFilter | SearchFilter | string[];
