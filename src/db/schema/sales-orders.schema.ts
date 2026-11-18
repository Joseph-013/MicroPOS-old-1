import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";
import { text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { salesOrderItems } from "./sales-order-items.schema";
import { SalesOrderSortField } from "@shared/src";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { SortableColumns } from "../../types/sortable-columns";
import { Item } from "./items.schema";

export const salesOrders = sqliteTable("sales_orders", {
  id: text().primaryKey(),
  orderNumber: text().notNull().unique(),
  snapshotTotalAmount: integer().notNull(),
  amountTendered: integer().notNull().default(0),
  changeAmount: integer().notNull().default(0),
  createdAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  deletedAt: text(),
});

export const salesOrdersRelations = relations(salesOrders, ({ many }) => ({
  items: many(salesOrderItems),
}));

export type SalesOrder = typeof salesOrders.$inferSelect;
export type NewSalesOrder = Omit<SalesOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">;
export type UpdateSalesOrder = Partial<NewSalesOrder>;

// export type CreateSalesOrderPayload = NewSalesOrder & {
//   items: {
//     itemId: Item["id"];
//     quantity: number;
//   };
// };

export const SalesOrderSortableColumns: SortableColumns<SalesOrderSortField> = {
  orderNumber: salesOrders.orderNumber,
  createdAt: salesOrders.createdAt,
  updatedAt: salesOrders.updatedAt,
  deletedAt: salesOrders.deletedAt,
};
