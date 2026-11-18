import { DateRangeFilter } from "../../db-types";
import { Item } from "../items/item.types";
import { SalesOrderItem } from "../sales-order-items/sales-order-items.types";

export interface SalesOrder {
  id: string;
  orderNumber: string;
  snapshotTotalAmount: number;
  amountTendered: number;
  changeAmount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const SALES_ORDER_LABEL_MAP: Record<keyof SalesOrder, string> = {
  id: "ID",
  orderNumber: "Order Number",
  snapshotTotalAmount: "Total",
  amountTendered: "Amount Tendered",
  changeAmount: "Change Amount",
  createdAt: "Created At",
  updatedAt: "Updated At",
  deletedAt: "Deleted At",
};

export type NewSalesOrder = Pick<SalesOrder, "changeAmount" | "amountTendered" | "snapshotTotalAmount"> & {
  items: {
    itemId: Item["id"];
    quantity: number;
  }[];
};
// export type UpdateSalesOrder = Partial<NewSalesOrder>;

export type SalesOrderSortField = "createdAt" | "orderNumber" | "updatedAt" | "deletedAt";

export type SalesOrderFilters = {
  orderNumber?: string;
  created_at?: DateRangeFilter;
  updated_at?: DateRangeFilter;
  deleted_at?: DateRangeFilter;
};

export type SalesOrderReceiptPayload = {
  datetimeISO: string;
  tableData: {
    name: SalesOrderItem["snapshotName"];
    price: SalesOrderItem["snapshotPrice"];
    quantity: SalesOrderItem["quantity"];
  }[];
  grandTotal: number;
  amountTendered: SalesOrder["amountTendered"];
  changeAmount: SalesOrder["changeAmount"];
  orderNumber: string;
  orderNumberURI: string;
};
