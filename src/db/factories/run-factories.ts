import { count } from "drizzle-orm";
import { items } from "../schema";
import { itemsFactory } from "./item.factory";
import { db } from "@config/database";
import { faker } from "@faker-js/faker";
import { salesOrderFactory } from "./sales-order.factory";
import { salesOrderItemsFactory } from "./sales-order-items.factory";

export type MinMax = {
  min?: number;
  max?: number;
};

/**
 * Core seeding engine orchestration
 */
export async function runFactories(): Promise<void> {
  console.log("🌱 Running database seeders...");

  // 1. Seed parents first and grab the valid identity entities
  const availableItems = await itemsFactory(db);
  const { rows: availableSalesOrders, ids: availableSalesOrderIds } = await salesOrderFactory(db, {
    min: 200,
    max: 500,
  });
  const availableSalesOrderItems = await salesOrderItemsFactory(db, {
    salesOrderIds: availableSalesOrderIds,
    itemsPerSalesOrder: { min: 1, max: 20 },
    items: availableItems,
  });

  // // 2. Inject parents directly into the child seeder dependency slot
  // if (availableItems.length > 0) {
  //   // await seedSalesOrders(db, availableItems);
  // } else {
  //   console.warn("⚠️ No items available to bind to sales orders. Skipping dependent seeds.");
  // }

  console.log("✅ Database seeding runner completed successfully.");
}

/**
 * 🔒 Conditional Execution Loop for Application Bootstrapping
 * Used by your Main Electron process pipeline
 */
export async function runConditionalFactory(): Promise<void> {
  // Check if items table is completely empty before executing
  const [totalResult] = await db.select({ value: count() }).from(items);
  const totalCount = totalResult?.value ?? 0;

  if (totalCount === 0) {
    console.log("📭 Database is empty. Initiating fallback factory pipeline...");
    await runFactories();
  } else {
    console.log(`⏭️ Database already populated (${totalCount} items). Skipping seed execution.`);
  }
}

// // =========================================================================
// // STANDALONE TERMINAL CLI ENGINE (For npm run db:seed)
// // =========================================================================
// const isMainModule = require.main === module;

// if (isMainModule) {
//   runSeeders()
//     .then(() => {
//       // Safely close the underlying better-sqlite3 database connection pool stream
//       if ("$client" in db) {
//         (db as any).$client.close();
//       }
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error("❌ Critical error during standalone database seeding:", error);
//       process.exit(1);
//     });
// }
