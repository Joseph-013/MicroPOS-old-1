import { computed, Service, signal } from '@angular/core';
import { ApiResponse, StoreConfig } from '@micropos/shared/src';
import { toast } from '@spartan-ng/brain/sonner';

@Service()
export class StoreConfigService {
  private readonly _state = signal<StoreConfig>({
    storeAddress: null,
    storeName: null,
  });

  public readonly config = this._state.asReadonly();

  public readonly storeAddress = computed(() => this._state().storeAddress);
  public readonly storeName = computed(() => this._state().storeName);

  async syncState() {
    try {
      const state = await window.electronAPI.invoke<StoreConfig>('store-config:getStoreConfig');
      this._state.set(state);
    } catch (error) {
      console.error('Failed to sync store state:', error);
      toast.error('Failed to sync store state.');
    }
  }

  async update(config: Partial<StoreConfig>): Promise<ApiResponse<string>> {
    const response = await window.electronAPI.invoke<ApiResponse<string>>(
      'store-config:updateStoreConfig',
      config,
    );
    if (response.status === 200) {
      this.syncState();
    }
    return response;
  }

  constructor() {
    this.syncState();
  }
}
