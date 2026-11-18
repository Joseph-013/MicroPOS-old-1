import { BrowserWindow } from "electron";
import { MainIPC } from "../../util/ipc-helpers";
import { salesOrderRepository } from "./sales-order.repository";
import { NewSalesOrder, PaginatedQueryOptions, SalesOrder, SalesOrderFilters } from "@shared/src";
import { UpdateSalesOrder } from "@db/schema";

export async function registerSalesOrderControls(mainWindow: BrowserWindow) {
  const entityName = "sales-orders";
  const endpoint = (method: string) => `${entityName}:${method}`;

  MainIPC.handleQuery(endpoint("get"), async (event, params: { id: string; options?: { withDeleted?: boolean } }) =>
    salesOrderRepository.getById(params.id, params.options),
  );
  MainIPC.handleQuery(
    endpoint("getByOrderNumber"),
    async (event, params: { orderNumber: string; options?: { withDeleted?: boolean } }) =>
      salesOrderRepository.getByOrderNumber(params.orderNumber, params.options),
  );
  MainIPC.handleQuery(endpoint("getAll"), async (event, options: PaginatedQueryOptions<SalesOrderFilters, any>) =>
    salesOrderRepository.getAll(options),
  );
  MainIPC.handleQuery(
    endpoint("getAllDeleted"),
    async (event, options: PaginatedQueryOptions<SalesOrderFilters, any>) =>
      await salesOrderRepository.getAllDeleted(options),
  );
  MainIPC.handleQuery(
    endpoint("create"),
    async (event, payload: NewSalesOrder) => await salesOrderRepository.create(payload),
  );
  // MainIPC.handleQuery(
  //   endpoint("update"),
  //   async (event, params: { id: string; payload: UpdateSalesOrder }) =>
  //     await salesOrderRepository.update(params.id, params.payload),
  // );
  MainIPC.handleQuery(
    endpoint("delete"),
    async (event, params: string | string[]) => await salesOrderRepository.delete(params),
  );
  MainIPC.handleQuery(
    endpoint("restore"),
    async (event, params: string | string[]) => await salesOrderRepository.restore(params),
  );
  // MainIPC.handleQuery(
  //   endpoint("printById"),
  //   async (event, salesOrderId: SalesOrder["id"]) => await salesOrderRepository.printById(salesOrderId),
  // );
}
