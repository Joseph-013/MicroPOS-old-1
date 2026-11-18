import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, model, viewChild } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { domToCanvas } from 'modern-screenshot';

@Component({
  selector: 'app-price-tag',
  imports: [HlmDialogImports, CurrencyPipe, HlmButtonImports],
  templateUrl: './price-tag.html',
  styleUrl: './price-tag.css',
})
export class PriceTag {
  public readonly data = model<{ price: number; name: string; barcode?: string | null } | null>(
    null,
  );

  private readonly tagPreview = viewChild<ElementRef<HTMLDivElement>>('tagPreview');

  public async printLiveElement(): Promise<void> {
    await document.fonts.ready;

    const element = this.tagPreview()?.nativeElement;
    if (!this.data() || !element) return;

    try {
      const canvas = await domToCanvas(element, {
        backgroundColor: '#ffffff',
        style: {
          margin: '0px',
          overflow: 'visible',
        },
      });

      const dataUrl = canvas.toDataURL('image/png');

      (window as any).electronAPI.invoke('receipt-printer:printRawImage', {
        base64Image: dataUrl,
      });
    } catch (err) {
      console.error('Failed to snapshot live DOM element:', err);
    }
  }
}
