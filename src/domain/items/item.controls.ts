import { BrowserWindow } from "electron";
import { MainIPC } from "../../util/ipc-helpers";
import { itemRepository } from "./item.repository";
import { ItemFilters, PaginatedQueryOptions } from "@shared/src";
import { NewItem, UpdateItem } from "@db/schema";

export async function registerItemControls(mainWindow: BrowserWindow) {
  MainIPC.handleQuery("items:search", async (event, searchString: string) => await itemRepository.search(searchString));
  MainIPC.handleQuery(
    "items:getByBarcode",
    async (event, barcode: string) => await itemRepository.getByBarcode(barcode),
  );
  MainIPC.handleQuery("items:getByPlu", async (event, barcode: string) => await itemRepository.getByPlu(barcode));
  MainIPC.handleQuery("items:nextAvailablePlu", async (event) => await itemRepository.getNextAvailablePlu());
  MainIPC.handleQuery("items:getByIds", async (event, ids: string[]) => await itemRepository.getByIds(ids));
  MainIPC.handleQuery(
    "items:get",
    async (
      event,
      params: {
        id: string;
        options?: { withDeleted?: boolean };
      },
    ) => await itemRepository.getById(params.id, params.options),
  );
  MainIPC.handleQuery(
    "items:getAll",
    async (event, options: PaginatedQueryOptions<ItemFilters, any>) => await itemRepository.getAll(options),
  );
  MainIPC.handleQuery(
    "items:getAllDeleted",
    async (event, options: PaginatedQueryOptions<ItemFilters, any>) => await itemRepository.getAllDeleted(options),
  );
  MainIPC.handleQuery("items:create", async (event, payload: NewItem) => await itemRepository.create(payload));
  MainIPC.handleQuery(
    "items:update",
    async (event, params: { id: string; payload: UpdateItem }) =>
      await itemRepository.update(params.id, params.payload),
  );
  MainIPC.handleQuery("items:delete", async (event, params: string | string[]) => await itemRepository.delete(params));
  MainIPC.handleQuery(
    "items:restore",
    async (event, params: string | string[]) => await itemRepository.restore(params),
  );
}
