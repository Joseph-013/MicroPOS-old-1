import { Service, signal } from '@angular/core';
import { ApiResponse, AssetResult, LogoUploadPayload } from '@micropos/shared/src';

export const SystemAssetTypes: string[] = ['micropos_black_base'] as const;
export type SystemAssetKeys = (typeof SystemAssetTypes)[number];

export const StoreAssetTypes: string[] = ['store_logo'] as const;
export type StoreAssetKeys = (typeof StoreAssetTypes)[number];

@Service()
export class AssetsService {
  private readonly _systemAssetsRegistry = signal<Record<SystemAssetKeys, string | null>>({
    micropos_black_base: null,
  });
  private readonly _storeAssetsRegistry = signal<Record<StoreAssetKeys, string | null>>({
    store_logo: null,
  });

  async initialize() {
    await this.sync();
    // console.log('Assets Initialized');
  }

  async sync() {
    const systemAssets: Record<SystemAssetKeys, string | null> = {};
    const storeAssets: Record<StoreAssetKeys, string | null> = {};

    const systemLogo = await window.electronAPI.invoke<ApiResponse<AssetResult>>(
      'system-assets:getMicroposLogo',
    );
    systemAssets['micropos_black_base'] = systemLogo.data?.url
      ? `${systemLogo.data.url}?t=${new Date().toISOString()}`
      : null;

    const storeLogo =
      await window.electronAPI.invoke<ApiResponse<AssetResult>>('store-assets:getLogo');
    storeAssets['store_logo'] = storeLogo.data?.url
      ? `${storeLogo.data.url}?t=${new Date().toISOString()}`
      : null;

    this._systemAssetsRegistry.set(systemAssets);
    this._storeAssetsRegistry.set(storeAssets);
  }

  getSystemAssetUrl(key: SystemAssetKeys): string | null {
    return this._systemAssetsRegistry()[key];
  }

  getStoreAssetUrl(key: StoreAssetKeys): string | null {
    return this._storeAssetsRegistry()[key];
  }

  async uploadStoreAsset(key: StoreAssetKeys, value: File) {
    switch (key) {
      case 'store_logo': {
        const base64 = await fileToBase64(value as File);
        const response = await window.electronAPI.invoke<ApiResponse<LogoUploadPayload>>(
          'store-assets:uploadLogo',
          {
            base64,
            mimeType: (value as File).type,
          },
        );
        if (response.status === 200) {
          await this.sync();
        }
        break;
      }
    }
  }

  async deleteStoreAsset(key: StoreAssetKeys) {
    switch (key) {
      case 'store_logo': {
        await window.electronAPI.invoke('store-assets:deleteLogo');
        await this.sync();
        break;
      }
    }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
