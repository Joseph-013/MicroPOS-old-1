import { faker } from "@faker-js/faker";
import { uuidv7 } from "uuidv7";
import { type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { salesOrders, type SalesOrder } from "../schema";
import { MinMax } from "./run-factories";

interface SalesOrderFactoryResults {
  rows: SalesOrder[];
  ids: string[];
}

export async function salesOrderFactory(
  db: BetterSQLite3Database<any>,
  count: MinMax,
): Promise<SalesOrderFactoryResults> {
  try {
    const min = count.min ?? 1;
    const max = count.max ?? 10;
    const targetCount = faker.number.int({ min, max });

    console.log(`🏭 Generating ${targetCount} base Sales Orders...`);

    const generatedOrderNumbers = new Set<string>();
    const ordersToInsert: Array<typeof salesOrders.$inferInsert> = [];

    const now = new Date();
    const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const nowISO = now.toISOString();

    while (ordersToInsert.length < targetCount) {
      const randomSuffix = faker.string.alphanumeric({
        length: 5,
        casing: "upper",
        exclude: ["I", "O", "0", "1"],
      });

      const orderNumber = `SO-${datePrefix}-${randomSuffix}`;

      if (!generatedOrderNumbers.has(orderNumber)) {
        generatedOrderNumbers.add(orderNumber);

        ordersToInsert.push({
          id: uuidv7(),
          orderNumber: orderNumber,
          snapshotTotalAmount: 0,
          createdAt: nowISO,
          updatedAt: nowISO,
          deletedAt: null,
        });
      }
    }

    const records = db.transaction((tx) => {
      if (ordersToInsert.length > 0) {
        return tx.insert(salesOrders).values(ordersToInsert).returning().all();
      }
      return [];
    });

    return {
      rows: records as SalesOrder[],
      ids: records.map((row) => row.id),
    };
  } catch (error) {
    console.error("Sales Order Factory failed. error: \n", error);
    throw error;
  }
}
