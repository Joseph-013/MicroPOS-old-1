///home/joseph/Dev/MicroPOS/angular/projects/electron-ui/src/app/shared/contracts/receipt-printer-templates/receipt-printer-template.base.ts

import { mmToChars } from '@angular-shared';
import { ReceiptConfig } from '@micropos/shared/src';
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

export interface IReceiptPrinterTemplate {
  build(config: ReceiptConfig): Promise<Uint8Array<ArrayBufferLike>>;
}

export abstract class ReceiptPrinterTemplate implements IReceiptPrinterTemplate {
  protected paperWidthMm: number = 0;
  protected charPerRow: number = 0;

  constructor(protected receiptConfig?: ReceiptConfig) {
    this.charPerRow = mmToChars(receiptConfig?.paperWidthMm ?? 58);
    this.paperWidthMm = receiptConfig?.paperWidthMm ?? 58;
  }

  protected divider = (symbol: string = '-') => symbol.repeat(this.charPerRow);

  /**
   * Subclasses must implement the receipt header (e.g., store name, address, date).
   */
  protected async header(encoder: ReceiptPrinterEncoder): Promise<ReceiptPrinterEncoder> {
    return encoder.newline();
  }

  /**
   * Subclasses must implement the main receipt body (e.g., itemized list, totals).
   */
  protected async content(encoder: ReceiptPrinterEncoder): Promise<ReceiptPrinterEncoder> {
    return encoder.newline();
  }
  /**
   * Subclasses must implement the receipt footer (e.g., thank you message, barcode/QR).
   */
  protected async footer(encoder: ReceiptPrinterEncoder): Promise<ReceiptPrinterEncoder> {
    return encoder;
  }

  /**
   * Orchestrates the building pipeline and returns the final byte array.
   */
  async build(): Promise<Uint8Array<ArrayBufferLike>> {
    let encoder = new ReceiptPrinterEncoder({
      language: 'esc-pos',
      width: mmToChars(this.receiptConfig?.paperWidthMm ?? 58),
      codepage: 'windows1252',
      feedBeforeCut: 2,
      imageMode: 'column',
    });

    encoder.initialize();
    encoder = await this.header(encoder);
    encoder = await this.content(encoder);
    encoder = await this.footer(encoder);

    return encoder.cut().encode();
  }
}
