import { SQLiteColumn } from "drizzle-orm/sqlite-core";

export type SortableColumns<TSortFields extends string> = Record<TSortFields, SQLiteColumn>;
