import type { Ean13Data } from "../types/ean-13-data";

export function decodeEan13(ean13: string): Ean13Data | null {
  if (!/^\d{13}$/.test(ean13)) {
    console.error("Invalid EAN-13 format: String must be 13 digits");
    return null;
  }

  const prefix = ean13.substring(0, 1);
  const plu = ean13.substring(1, 6);
  const weight = ean13.substring(6, 12);
  const check = ean13.substring(12, 13);

  if (!verifyChecksum(ean13)) {
    console.warn("Checksum mismatch: The barcode data may be corrupted.");
  }

  return { prefix, plu, weight, check };
}

function verifyChecksum(ean13: string): boolean {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(ean13[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === parseInt(ean13[12], 10);
}

export function encodeEan13(plu: string, weight: string): string | null {
  if (!/^\d{5}$/.test(plu) || !/^\d{6}$/.test(weight)) {
    console.error("Invalid input: PLU must be 5 digits, Weight must be 6 digits");
    return null;
  }

  const base = `2${plu}${weight}`;
  const checkDigit = calculateChecksum(base);

  return `${base}${checkDigit}`;
}

function calculateChecksum(data: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(data[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}
