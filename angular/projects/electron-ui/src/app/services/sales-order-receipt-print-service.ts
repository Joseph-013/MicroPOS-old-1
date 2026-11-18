import {
  ImageProcessorData,
  SalesOrderReceiptTemplate,
  SalesOrderReceiptTemplatePayload,
} from '@angular-shared';
import { Service } from '@angular/core';
import { SalesOrderService } from './data/sales-order-service';
import { AssetsService } from './assets-service';
import { ReceiptPrinterService } from './receipt-printer-service';
import { SalesOrderItem, StoreConfig } from '@micropos/shared/src';
import { StoreConfigService } from './store-config.service';
import { firstValueFrom } from 'rxjs';
import { SalesOrderItemService } from './data/sales-order-item-service';

@Service()
export class SalesOrderReceiptPrintService {
  async printSalesOrderReceipt(
    salesOrderService: SalesOrderService,
    salesOrderItemService: SalesOrderItemService,
    receiptPrinterService: ReceiptPrinterService,
    assetService: AssetsService,
    storeConfigService: StoreConfigService,
    salesOrderId: string,
  ) {
    const storeLogoData: ImageProcessorData | null = assetService.getStoreAssetUrl('store_logo')
      ? {
          imageURL: assetService.getStoreAssetUrl('store_logo')!,
        }
      : null;
    const systemLogoData: ImageProcessorData = {
      imageURL: assetService.getSystemAssetUrl('micropos_black_base')!,
      width: 192,
    };
    const storeConfig: StoreConfig = storeConfigService.config();
    const salesOrderResponse = await firstValueFrom(salesOrderService.get(salesOrderId));
    if (salesOrderResponse.status !== 200) return;
    const {
      orderNumber,
      snapshotTotalAmount,
      amountTendered,
      changeAmount,
      createdAt: salesOrderCreatedAt,
    } = salesOrderResponse!.data!;
    const salesOrderItemResponse = await firstValueFrom(
      salesOrderItemService.getBySalesOrderId(salesOrderId),
    );
    const tableData: {
      name: SalesOrderItem['snapshotName'];
      price: SalesOrderItem['snapshotPrice'];
      quantity: SalesOrderItem['quantity'];
    }[] =
      salesOrderItemResponse?.data?.map((i) => ({
        name: i.snapshotName,
        price: i.snapshotPrice,
        quantity: i.quantity,
      })) ?? [];
    const orderNumberURI = `sales-orders://${orderNumber}`;

    const payload: SalesOrderReceiptTemplatePayload = {
      receiptConfig: receiptPrinterService.receiptConfig() ?? undefined,
      storeLogoData: storeLogoData ?? undefined,
      systemLogoData,
      storeConfig,
      orderNumber,
      datetimeISO: salesOrderCreatedAt,
      tableData,
      grandTotal: snapshotTotalAmount,
      amountTendered,
      changeAmount,
      orderNumberURI,
    };

    const printerPayloadTemplate = new SalesOrderReceiptTemplate(payload);

    const printerPayload = await printerPayloadTemplate.build();

    receiptPrinterService.print(printerPayload);
  }
}
