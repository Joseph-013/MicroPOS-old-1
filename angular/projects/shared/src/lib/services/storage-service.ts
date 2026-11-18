import { Service } from '@angular/core';

// TODO use
export const ALLOWED_STORAGE_KEYS = [
  // 'receipt_printer_saved_device',
  // 'receipt_printer_saved_config',
  // 'user_preferences',
] as const;

export type StorageKey = (typeof ALLOWED_STORAGE_KEYS)[number];

@Service()
export class StorageService {
  get<T = unknown>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch (err) {
      console.warn(`Failed to parse localStorage item "${key}"`, err);
      return null;
    }
  }

  set<T = unknown>(key: string, value: T): void {
    if (value === undefined || !value) {
      if (!value) {
        console.error(`Setting ${key} with a nullish value. Removing...`);
      }

      this.remove(key);

      return;
    }

    try {
      const json = JSON.stringify(value);
      localStorage.setItem(key, json);
    } catch (err) {
      console.error(`Failed to set localStorage item "${key}"`, err);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clearAll(): void {
    localStorage.clear();
  }

  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
