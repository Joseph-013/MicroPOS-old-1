import { Service, inject } from '@angular/core';
import { firstValueFrom, from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, Setting } from '@micropos/shared/src';

@Service()
export class SettingsService {
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const response = await window.electronAPI.invoke<ApiResponse<Setting<string>>>(
        'settings:get',
        key,
      );

      if (response.status !== 200 || !response.data) {
        return null;
      }

      return response.data.value as T;
    } catch (err) {
      console.warn(`Failed to get setting "${key}"`, err);
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    if (value === undefined) {
      await this.remove(key);
      return;
    }

    try {
      const response = await window.electronAPI.invoke<ApiResponse<void>>('settings:set', {
        key,
        value,
        updatedAt: new Date().toISOString(),
      });

      if (response.status !== 200) {
        throw new Error(response.error || 'Failed to set setting');
      }
    } catch (err) {
      console.error(`Failed to set setting "${key}"`, err);
      throw err;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const response = await window.electronAPI.invoke<ApiResponse<void>>('settings:remove', key);

      if (response.status !== 200) {
        throw new Error(response.error || 'Failed to remove setting');
      }
    } catch (err) {
      console.error(`Failed to remove setting "${key}"`, err);
      throw err;
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}
