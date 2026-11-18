import {
  extractQrUrlPayload,
  extractQrUrlProtocol,
  isQRProtocol,
  protocolToRoute,
  QRProtocolRegistry,
  QRProtocols,
} from '@angular-shared';
import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

interface OnBarcodeScannedPayload {
  barcode: string;
  source: string;
}

@Service()
export class ScannerService {
  private readonly scanSubject$ = new Subject<OnBarcodeScannedPayload>();
  private readonly router = inject(Router);

  public readonly dataStream$: Observable<OnBarcodeScannedPayload> =
    this.scanSubject$.asObservable();

  constructor() {
    this.enable();

    window.electronAPI.on('onBarcodeScanned', (data: OnBarcodeScannedPayload) => {
      console.log('Scan detected globally:', data);
      this.handleScan(data);
    });
  }

  private handleScan(data: OnBarcodeScannedPayload): void {
    const protocol = extractQrUrlProtocol(data.barcode);
    console.log('Protocol:', protocol);

    if (protocol && isQRProtocol(protocol)) {
      this.handleProtocolScan(protocol as QRProtocols, data.barcode);
    } else {
      if (data.barcode.startsWith('2')) {
        console.log('PLU-based barcode detected');
      }
      this.scanSubject$.next(data);
    }
  }

  private handleProtocolScan(protocol: QRProtocols, barcode: string): void {
    console.log('protocol scan detected');
    const payload = extractQrUrlPayload(barcode);

    switch (protocol) {
      case 'sales-orders': {
        const route = protocolToRoute(protocol);
        this.router.navigate([...route, payload], { replaceUrl: true });
        break;
      }
      default: {
        const _exhaustiveCheck: never = protocol;
        console.warn(`Unknown protocol: ${protocol}`);
      }
    }
  }

  public enable(): void {
    window.electronAPI.send('setKeyboardWedgeScannerStatus', { status: 'on' });
    console.log('Global hardware scanner listener activated.');
  }

  public disable(): void {
    window.electronAPI.send('setKeyboardWedgeScannerStatus', { status: 'off' });
    console.log('Global hardware scanner listener deactivated.');
  }
}
