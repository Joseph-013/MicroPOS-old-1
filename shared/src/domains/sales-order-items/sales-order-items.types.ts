import { DateRangeFilter } from "../../db-types";

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  itemId?: string;
  snapshotName: string;
  quantity: number;
  snapshotPrice: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const SALES_ORDER_ITEM_LABEL_MAP: Record<keyof SalesOrderItem, string> = {
  id: "ID",
  salesOrderId: "Sales Order Number",
  itemId: "Item Id",
  snapshotName: "Snapshot Name",
  quantity: "Quantity",
  snapshotPrice: "Snapshot Price",
  createdAt: "Created At",
  updatedAt: "Updated At",
  deletedAt: "Deleted At",
};

export type NewSalesOrderItem = Omit<
  SalesOrderItem,
  "id" | "snapshotName" | "snapshotPrice" | "createdAt" | "updatedAt" | "deletedAt"
>;
export type UpdateSalesOrderItem = Partial<NewSalesOrderItem>;

export type SalesOrderItemSortField = "createdAt" | "updatedAt" | "deletedAt" | "snapshotName";

export type SalesOrderItemFilters = {
  snapshotName?: string;
  salesOrderNumber?: string;
  created_at?: DateRangeFilter;
  updated_at?: DateRangeFilter;
  deleted_at?: DateRangeFilter;
};
