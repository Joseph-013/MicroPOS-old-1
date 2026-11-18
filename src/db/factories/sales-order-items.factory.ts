import { faker } from "@faker-js/faker";
import { uuidv7 } from "uuidv7";
import { type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { SalesOrderItem, salesOrderItems, salesOrders, type Item } from "../schema";
import { MinMax } from "./run-factories";

interface SalesOrderItemFactoryConfig {
  salesOrderIds: string[];
  itemsPerSalesOrder: MinMax;
  items: Item[];
}

interface SalesOrderItemFactoryResults {
  rows: SalesOrderItem[];
}

export function salesOrderItemsFactory(
  db: BetterSQLite3Database<any>,
  config: SalesOrderItemFactoryConfig,
): SalesOrderItemFactoryResults {
  const { salesOrderIds, itemsPerSalesOrder, items: availableItems } = config;

  if (availableItems.length === 0) {
    throw new Error("Cannot seed sales order items: available items array is empty.");
  }

  const minItems = itemsPerSalesOrder.min ?? 1;
  const maxItems = itemsPerSalesOrder.max ?? 5;
  const nowISO = new Date().toISOString();

  console.log(`Generating line items for ${salesOrderIds.length} sales orders...`);

  const lineItemsToInsert: Array<typeof salesOrderItems.$inferInsert> = [];
  const orderTotalsMap = new Map<string, number>();
  const orderPaymentsMap = new Map<string, { amountTendered: number; changeAmount: number }>();

  for (const orderId of salesOrderIds) {
    orderTotalsMap.set(orderId, 0);
  }

  for (const orderId of salesOrderIds) {
    const targetLineItemCount = faker.number.int({ min: minItems, max: maxItems });
    const chosenItems = faker.helpers.arrayElements(availableItems, targetLineItemCount);

    for (const item of chosenItems) {
      const isVariableItem = item.plu !== null && !["fixed", "embedded"].includes(item.priceMode);

      const quantity = isVariableItem
        ? Math.round(faker.number.float({ min: 0.01, max: 10, fractionDigits: 2 }) * 100)
        : faker.number.int({ min: 1, max: 10 }) * 100;

      const lineTotal = Math.round(item.price * (quantity / 100));

      const currentTotal = orderTotalsMap.get(orderId) ?? 0;
      orderTotalsMap.set(orderId, Math.round(currentTotal + lineTotal));

      lineItemsToInsert.push({
        id: uuidv7(),
        salesOrderId: orderId,
        itemId: item.id,
        snapshotName: item.name,
        snapshotPrice: item.price,
        quantity: quantity,
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      });
    }
  }

  for (const [orderId, totalAmount] of orderTotalsMap.entries()) {
    const amountTendered = Math.round(totalAmount + faker.number.int({ min: 0, max: 5000 }) * 100);
    const changeAmount = Math.round(amountTendered - totalAmount);

    orderPaymentsMap.set(orderId, { amountTendered, changeAmount });
  }

  const insertedRows = db.transaction((tx) => {
    const results: SalesOrderItem[] = [];

    // Insert line items in chunks
    if (lineItemsToInsert.length > 0) {
      const chunkSize = 2000;
      for (let i = 0; i < lineItemsToInsert.length; i += chunkSize) {
        const chunk = lineItemsToInsert.slice(i, i + chunkSize);
        const records = tx.insert(salesOrderItems).values(chunk).returning().all();
        results.push(...(records as SalesOrderItem[]));
      }
    }

    // Update parent sales orders with totals and payment information
    console.log(`Syncing totals and payment data for ${orderTotalsMap.size} sales orders...`);
    for (const [orderId, snapshotTotalAmount] of orderTotalsMap.entries()) {
      const paymentInfo = orderPaymentsMap.get(orderId);
      if (!paymentInfo) continue;

      tx.update(salesOrders)
        .set({
          snapshotTotalAmount,
          amountTendered: paymentInfo.amountTendered,
          changeAmount: paymentInfo.changeAmount,
          updatedAt: nowISO,
        })
        .where(eq(salesOrders.id, orderId))
        .run();
    }

    return results;
  });

  console.log(`Generated ${insertedRows.length} line items with payment data.`);

  return { rows: insertedRows };
}
