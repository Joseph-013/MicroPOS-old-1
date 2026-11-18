import { faker } from "@faker-js/faker";
import { uuidv7 } from "uuidv7";
import { count } from "drizzle-orm";
import { type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { Item, items } from "../schema";
import { SAMPLE_BARCODES } from "./sample-item-barcodes";
import { SAMPLE_PLUs } from "./sample-item-plu";

export async function itemsFactory(db: BetterSQLite3Database<any>): Promise<Item[]> {
  const [totalResult] = await db.select({ value: count() }).from(items);
  const totalCount = totalResult?.value ?? 0;

  if (totalCount > 0) {
    console.log("🌱 Items table already seeded. Fetching records for downstream seeders...");
    return (await db.select().from(items)) as Item[];
  }

  console.log("🌱 Starting items database seeding pipeline...");

  const itemsToInsert: Array<typeof items.$inferInsert> = [];

  const uniqueSampleBarcodes = Array.from(new Set(SAMPLE_BARCODES));
  const uniqueSamplePLUs = Array.from(new Set(SAMPLE_PLUs));

  for (let i = 0; i < uniqueSampleBarcodes.length; i++) {
    const barcode = uniqueSampleBarcodes[i];
    const itemName = `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${faker.commerce.product()}`;

    const sku = generateUniqueSku(itemName);

    itemsToInsert.push({
      id: uuidv7(),
      barcode: barcode,
      sku: sku,
      name: itemName,
      price: Math.round(parseFloat(faker.commerce.price({ min: 10, max: 500, dec: 2 }))),
    });
  }

  for (let i = 0; i < uniqueSamplePLUs.length; i++) {
    const plu = uniqueSamplePLUs[i];

    const itemName = `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${faker.commerce.product()} (v)`;
    const sku = generateUniqueSku(itemName);
    const priceMode = faker.helpers.arrayElement([
      "per_kg",
      "per_g",
      "per_m",
      "per_in",
      "per_lit",
      "per_ml",
      "per_pack",
    ]);

    itemsToInsert.push({
      id: uuidv7(),
      plu,
      sku: sku,
      name: itemName,
      priceMode,
      price: Math.round(parseFloat(faker.commerce.price({ min: 10, max: 500, dec: 2 }))),
    });
  }

  const nonIndexedItemsCount = 1000;

  const localBarcodeCache = new Set<string>();

  for (let i = 0; i < nonIndexedItemsCount; i++) {
    const itemName = `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${faker.commerce.product()}`;

    let barcode = faker.string.numeric(13);

    while (localBarcodeCache.has(barcode) || uniqueSampleBarcodes.includes(barcode)) {
      barcode = faker.string.numeric(13);
    }

    localBarcodeCache.add(barcode);

    itemsToInsert.push({
      id: uuidv7(),
      barcode: barcode,
      sku: `SKU-GEN-${1000 + i}`,
      name: itemName,
      price: Math.round(parseFloat(faker.commerce.price({ min: 10, max: 500, dec: 2 })) * 100),
    });
  }

  const seededRecords = db.transaction((tx) => {
    if (itemsToInsert.length > 0) {
      return tx.insert(items).values(itemsToInsert).returning().all();
    }
    return [];
  });

  return seededRecords;
}

const usedSkus = new Set<string>();

function generateUniqueSku(name: string): string {
  const base = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 5);
  let sku = `SKU-${base}-${Math.floor(1000 + Math.random() * 9000)}`;

  // If the SKU exists, append a random number until it's unique
  while (usedSkus.has(sku)) {
    sku = `SKU-${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  usedSkus.add(sku);
  return sku;
}
