import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ThemeService } from '@angular-shared';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { filter } from 'rxjs';
import { ReceiptPrinterService } from './services/receipt-printer-service';
import { ApiResponse } from '@micropos/shared/src';
import { toast } from '@spartan-ng/brain/sonner';
import { StoreConfigService } from './services/store-config.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmToasterImports],
  templateUrl: './app.html',
  styles: [],
})
export class App {
  private readonly router = inject(Router);

  constructor(
    // Initializations
    receiptPrinterService: ReceiptPrinterService,
    storeConfigService: StoreConfigService,
    theme: ThemeService,
  ) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        console.log('Visited Route:', event.urlAfterRedirects);
      });

    window.electronAPI.on('receipt-printer:onAutoConnect', (response: ApiResponse<string>) => {
      if (response.status !== 200) {
        toast.error('Printer auto-connect failed', {
          description: 'Cannot connect printer.',
          action: {
            label: 'Settings',
            onClick: () =>
              this.router.navigate(['/authenticated', 'settings', 'configure-receipt-printer']),
          },
        });
      }
    });
  }
}
