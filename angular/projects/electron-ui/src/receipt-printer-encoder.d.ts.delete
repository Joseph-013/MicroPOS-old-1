declare module '@point-of-sale/receipt-printer-encoder' {
  export default class ReceiptPrinterEncoder {
    constructor(options: ReceiptPrinterEncoderOptions);
    initialize(): this;
    newline(): this;
    align(direction: string): this;
    line(text: string): this;
    image(canvas: any, width: number, height: number, mode: string): this;
    table(columns: any[], rows: string[][]): this;
    bold(enabled: boolean): this;
    italic(enabled: boolean): this;
    qrcode(text: string, model: number, size: number, errorLevel: string): this;
    cut(): this;
    encode(): Uint8Array;
  }

  interface ReceiptPrinterEncoderOptions {
    language: string;
    width: number;
    codepage: string;
    feedBeforeCut: number;
    imageMode: string;
  }
}
