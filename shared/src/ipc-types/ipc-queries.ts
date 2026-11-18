import { ApiResponse } from ".";
import {
  CursorPaginationOptions,
  CursorPaginationResponse,
  PaginatedQueryOptions,
  PaginationResponse,
} from "../db-types";
import { Item, ItemFilters, ItemSortField, NewItem, UpdateItem } from "../domains";
import { HIDDevice, UsbDeviceInfo } from "../types";

export interface IpcQueries {
  /*
    ITEMS
  */
  itemsSearch: {
    request: {
      searchString: string;
      withDeleted?: boolean;
    };
    response: ApiResponse<Item[]>;
  };
  itemsGetByBarcode: {
    request: {
      barcode: string;
      withDeleted?: boolean;
    };
    response: ApiResponse<Item | undefined>;
  };
  itemsGet: {
    request: {
      id: string;
      withDeleted?: boolean;
    };
    response: ApiResponse<Item | undefined>;
  };
  itemsGetByIds: {
    request: {
      ids: string[];
      withDeleted?: boolean;
    };
    response: ApiResponse<Record<string, Item>>;
  };
  itemsGetAllPaginated: {
    request: {
      options: PaginatedQueryOptions<ItemFilters, ItemSortField>;
      withDeleted?: boolean;
    };
    response: ApiResponse<PaginationResponse<Item>>;
  };
  itemsGetAllCursorPaginated: {
    request: {
      options: CursorPaginationOptions<ItemFilters, ItemSortField>;
      withDeleted?: boolean;
    };
    response: ApiResponse<CursorPaginationResponse<Item>>;
  };
  itemsCreate: {
    request: {
      payload: NewItem;
    };
    response: ApiResponse<Item>;
  };
  itemsUpdate: {
    request: {
      id: string;
      payload: UpdateItem;
    };
    response: ApiResponse<Item>;
  };
  itemsDelete: {
    request: { id: string | string[] };
    response: ApiResponse<void>;
  };
  // itemsForceDelete: {
  //   request: { id: string | string[] };
  //   response: ApiResponse<void>;
  // };
  itemsRestore: {
    request: { id: string | string[] };
    response: ApiResponse<void>;
  };

  /*
    SYSTEM
  */
  systemGetClientUrl: {
    request: void;
    response: ApiResponse<string>;
  };
  ping: {
    request: void;
    response: string;
  };
  getHIDDevices: {
    request: void;
    response: ApiResponse<HIDDevice[]>;
  };
  getUSBDevices: {
    request: void;
    response: ApiResponse<UsbDeviceInfo[]>;
  };
  printerConnect: {
    request: {
      device: UsbDeviceInfo;
    };
    response: ApiResponse<void>;
  };
  printerGetPaperWidth: {
    request: void;
    response: ApiResponse<number>;
  };
  printerSetPaperWidth: {
    request: number;
    response: ApiResponse<void>;
  };
  printerDisconnect: {
    request: void;
    response: ApiResponse<void>;
  };
}
