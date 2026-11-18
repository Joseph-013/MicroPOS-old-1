import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

@Directive({
  selector: '[clickToCopy]',
  host: {
    '[style.cursor]': '"pointer"',
    '[attr.title]': '"Click to copy"',
    '(click)': 'onClick()',
  },
})
export class ClickToCopyDirective {
  private readonly el = inject(ElementRef<HTMLElement>);

  async onClick(): Promise<void> {
    const text = this.el.nativeElement.textContent?.trim() ?? '';

    if (!text) {
      toast.error('No text to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Clipboard error:', error);
      toast.error('Failed to copy');
    }
  }
}
