import { ReceiptConfig, SalesOrderItem, StoreConfig } from '@micropos/shared/src';
import { formatCurrency, processReceiptImage, ReceiptPrinterTemplate } from '@angular-shared';
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

export interface ImageProcessorData {
  imageURL: string;
  width?: number;
  height?: number;
}

export interface SalesOrderReceiptTemplatePayload {
  receiptConfig?: ReceiptConfig;
  storeLogoData?: ImageProcessorData;
  systemLogoData: ImageProcessorData;
  storeConfig: StoreConfig;
  orderNumber: string;
  datetimeISO: string;
  tableData: {
    name: SalesOrderItem['snapshotName'];
    price: SalesOrderItem['snapshotPrice'];
    quantity: SalesOrderItem['quantity'];
  }[];
  grandTotal: number;
  amountTendered: number;
  changeAmount: number;
  orderNumberURI: string;
}

export class SalesOrderReceiptTemplate extends ReceiptPrinterTemplate {
  private halfWidth: number = 0;
  private qtyColumnWidth: number = 0;
  private totalColumnWidth: number = 0;
  private margin: number = 1;
  private itemColumnWidth: number = 0;

  constructor(private payload: SalesOrderReceiptTemplatePayload) {
    super(payload.receiptConfig);
    const charPerRow = this.charPerRow;
    this.halfWidth = Math.floor(charPerRow / 2);
    this.qtyColumnWidth = Math.floor(charPerRow * 0.26);
    this.totalColumnWidth = Math.floor(charPerRow * 0.26);
    this.itemColumnWidth =
      charPerRow - this.qtyColumnWidth - this.totalColumnWidth - this.margin * 3;
  }

  protected override async header(encoder: ReceiptPrinterEncoder) {
    encoder = encoder.align('center');
    if (this.payload.storeLogoData) {
      const { height, imageData, width } = await processReceiptImage(
        this.payload.storeLogoData.imageURL,
        this.paperWidthMm,
      );
      encoder = encoder.align('center').image(imageData, width, height, 'threshold').newline();
    }

    if (this.payload.storeConfig.storeName) {
      encoder = encoder.line(this.payload.storeConfig.storeName).newline();
    }
    if (this.payload.storeConfig.storeAddress) {
      encoder = encoder.line(this.payload.storeConfig.storeAddress).newline();
    }

    encoder = encoder
      .align('left')
      .line(`Order Number: ${this.payload.orderNumber}`)
      .line(`Date: ${new Date(this.payload.datetimeISO).toLocaleString()}`)
      .line(this.divider('*'));
    return encoder;
  }

  protected override async content(encoder: ReceiptPrinterEncoder) {
    encoder = encoder
      .table(
        [
          { width: this.itemColumnWidth, marginRight: this.margin, align: 'left' },
          { width: this.qtyColumnWidth, marginRight: this.margin, align: 'left' },
          { width: this.totalColumnWidth, marginRight: this.margin, align: 'right' },
        ],
        this.payload.tableData.map((entry) => [
          `${entry.name}\n`,
          `@${formatCurrency(entry.price)}\nx${entry.quantity}`,
          `${formatCurrency(entry.price * entry.quantity)}\n`,
        ]),
      )
      .line(this.divider());
    return encoder;
  }

  protected override async footer(encoder: ReceiptPrinterEncoder) {
    const { height, imageData, width } = await processReceiptImage(
      this.payload.systemLogoData.imageURL,
      this.paperWidthMm,
    );

    encoder = encoder
      .bold(true)
      .table(
        [
          { width: this.halfWidth, align: 'left' },
          { width: this.halfWidth, align: 'right' },
        ],
        [['GRAND TOTAL:', `PHP ${formatCurrency(this.payload.grandTotal)}`]],
      )
      .bold(false)
      .newline()
      .table(
        [
          { width: this.halfWidth, align: 'left' },
          { width: this.halfWidth, align: 'right' },
        ],
        [
          ['Amount Tendered:', `PHP ${formatCurrency(this.payload.amountTendered)}`],
          ['Change Provided:', `PHP ${formatCurrency(this.payload.changeAmount)}`],
        ],
      )
      .line(this.divider('*'))
      .newline()
      .align('center')
      .line('This is an order slip. Return and ask for your Official Receipt or Sales Invoice.')
      .newline()
      .italic(true)
      .line('THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX')
      .italic(false)
      .newline()
      .line('Powered by:')
      .image(imageData, width, height, 'threshold')
      .line(' ')
      .newline()
      .line(' ')
      .qrcode(this.payload.orderNumberURI, 1, 8, 'h');

    return encoder;
  }
}
