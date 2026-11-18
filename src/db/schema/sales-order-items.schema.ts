import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { salesOrders } from "./sales-orders.schema";
import { relations } from "drizzle-orm";
import { items } from "./items.schema";
import { SortableColumns } from "../../types/sortable-columns";
import { SalesOrderItemSortField } from "@shared/src";

export const salesOrderItems = sqliteTable("sales_order_items", {
  id: text().primaryKey(),
  salesOrderId: text()
    .notNull()
    .references(() => salesOrders.id, { onDelete: "cascade" }),
  itemId: text("item_id").references(() => items.id, { onDelete: "set null" }),
  snapshotName: text().notNull(),
  quantity: integer().notNull(),
  snapshotPrice: integer().notNull(),
  createdAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  deletedAt: text(),
});

export const salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesOrderItems.salesOrderId],
    references: [salesOrders.id],
  }),
  item: one(items, {
    fields: [salesOrderItems.itemId],
    references: [items.id],
  }),
}));

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type NewSalesOrderItem = typeof salesOrderItems.$inferInsert;
export type UpdateSalesOrderItem = Partial<Omit<SalesOrderItem, "id" | "createdAt" | "updatedAt" | "deletedAt">>;

export const SalesOrderItemSortableColumns: SortableColumns<SalesOrderItemSortField> = {
  createdAt: salesOrderItems.createdAt,
  updatedAt: salesOrderItems.updatedAt,
  deletedAt: salesOrderItems.deletedAt,
  snapshotName: salesOrderItems.snapshotName,
};
