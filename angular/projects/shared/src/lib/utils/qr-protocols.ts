export function extractQrUrlProtocol(barcode: string): string | null {
  if (!barcode) return null;
  const match = barcode.match(/^([a-zA-Z0-9-]+):\/\//);
  return match ? match[1] : null;
}

export function extractQrUrlPayload(barcode: string): string {
  const index = barcode.indexOf('://');
  return index !== -1 ? barcode.slice(index + 3) : barcode;
}

export function isQRProtocol(value: string): value is QRProtocols {
  return (QRProtocolRegistry as readonly string[]).includes(value);
}

export const QRProtocolRegistry = ['sales-orders'] as const;

export type QRProtocols = (typeof QRProtocolRegistry)[number];

export function protocolToRoute(protocol: QRProtocols): string[] {
  switch (protocol) {
    case 'sales-orders': {
      return ['/authenticated', protocol];
    }
  }
}
