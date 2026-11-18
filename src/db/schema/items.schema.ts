import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { SortableColumns } from "../../types/sortable-columns";
import { ItemSortField, PRICE_MODES } from "@shared/src";

export const items = sqliteTable("items", {
  id: text().primaryKey(),
  barcode: text().unique(),
  plu: text().unique(),
  sku: text().unique(),
  name: text().notNull(),
  price: integer().notNull(),
  priceMode: text({
    enum: PRICE_MODES,
  })
    .notNull()
    .default("fixed"),
  createdAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  deletedAt: text(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type UpdateItem = Partial<Omit<Item, "id" | "createdAt" | "updatedAt" | "deletedAt">>;

export const ItemSortableColumns: SortableColumns<ItemSortField> = {
  barcode: items.barcode,
  sku: items.sku,
  name: items.name,
  createdAt: items.createdAt,
  updatedAt: items.updatedAt,
  deletedAt: items.deletedAt,
};
