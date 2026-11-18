import { PaginatedQueryOptions, SalesOrderItemFilters } from "@shared/src";
import { MainIPC } from "../../util/ipc-helpers";
import { salesOrderItemRepository } from "./sales-order-item.repository";
import { NewSalesOrderItem, SalesOrder, UpdateSalesOrderItem } from "@db/schema";

export async function registerSalesOrderItemControls() {
  const entityName = "sales-order-items";
  const endpoint = (method: string) => `${entityName}:${method}`;
  MainIPC.handleQuery(endpoint("get"), async (event, id: string) => salesOrderItemRepository.getById(id));
  MainIPC.handleQuery(endpoint("getBySalesOrderId"), async (event, salesOrderId: SalesOrder["id"]) =>
    salesOrderItemRepository.getBySalesOrderId(salesOrderId),
  );
  MainIPC.handleQuery(endpoint("getAll"), async (event, options: PaginatedQueryOptions<SalesOrderItemFilters, any>) =>
    salesOrderItemRepository.getAll(options),
  );
  MainIPC.handleQuery(
    endpoint(""),
    async (event, options: PaginatedQueryOptions<SalesOrderItemFilters, any>) =>
      await salesOrderItemRepository.getAllDeleted(options),
  );
  MainIPC.handleQuery(
    endpoint("create"),
    async (event, payload: NewSalesOrderItem) => await salesOrderItemRepository.create(payload),
  );
  MainIPC.handleQuery(
    endpoint(""),
    async (event, params: { id: string; payload: UpdateSalesOrderItem }) =>
      await salesOrderItemRepository.update(params.id, params.payload),
  );
  MainIPC.handleQuery(
    endpoint(""),
    async (event, params: string | string[]) => await salesOrderItemRepository.delete(params),
  );
  MainIPC.handleQuery(
    endpoint(""),
    async (event, params: string | string[]) => await salesOrderItemRepository.restore(params),
  );
}
