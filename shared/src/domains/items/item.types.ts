import { DateRangeFilter } from "../../db-types";

export interface Item {
  id: string;
  barcode: string | null;
  sku: string | null;
  plu: string | null;
  name: string;
  price: number;
  priceMode: PriceMode;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const ITEM_LABEL_MAP: Record<keyof Item, string> = {
  id: "ID",
  barcode: "Barcode",
  sku: "SKU",
  plu: "PLU",
  name: "Name",
  price: "Price",
  priceMode: "Price Mode",
  createdAt: "Created At",
  updatedAt: "Updated At",
  deletedAt: "Deleted At",
};

export const PRICE_MODES = [
  "fixed",
  "embedded",
  "per_kg",
  "per_g",
  "per_m",
  "per_in",
  "per_lit",
  "per_ml",
  "per_pack",
] as const;

export type PriceMode = (typeof PRICE_MODES)[number];

export const PRICE_MODE_TO_LABEL_MAP: Record<PriceMode, string> = {
  fixed: "Fixed",
  embedded: "Embedded",
  per_kg: "Per Kilogram",
  per_g: "Per Gram",
  per_m: "Per Meter",
  per_in: "Per Inch",
  per_lit: "Per Liter",
  per_ml: "Per Milliliter",
  per_pack: "Per Pack",
};

export const PRICE_MODE_OPTIONS: readonly { label: string; value: PriceMode }[] = PRICE_MODES.map((mode) => ({
  label: PRICE_MODE_TO_LABEL_MAP[mode],
  value: mode,
}));

export type NewItem = Omit<Item, "id" | "createdAt" | "updatedAt" | "deletedAt" | "priceMode"> & {
  priceMode: PriceMode | null;
};
export type UpdateItem = Partial<NewItem>;

export type ItemSortField = "barcode" | "sku" | "name" | "createdAt" | "updatedAt" | "deletedAt";

export type ItemFilters = {
  barcode?: string;
  sku?: string;
  name?: string;
  created_at?: DateRangeFilter;
  updated_at?: DateRangeFilter;
  deleted_at?: DateRangeFilter;
  search?: string;
};
