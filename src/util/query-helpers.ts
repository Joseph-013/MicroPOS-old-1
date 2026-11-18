import { and, eq, isNull, isNotNull, SQL } from "drizzle-orm";
import { uuidv7 } from "uuidv7";

// reusable soft delete filter
export const notDeleted = <T extends { deletedAt: any }>(table: T): SQL => isNull(table.deletedAt);

export const isDeleted = <T extends { deletedAt: any }>(table: T): SQL => isNotNull(table.deletedAt);

// reusable id generation
export const newId = () => uuidv7();

// reusable timestamps
export const nowISO = () => new Date().toISOString();
