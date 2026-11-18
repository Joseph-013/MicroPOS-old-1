import { Component, computed, contentChild, ElementRef, inject, viewChild } from '@angular/core';
import { ToggleFieldDirective } from '../../directives/form-mode';

@Component({
  selector: 'lib-toggle-field',
  imports: [],
  templateUrl: './toggle-field.html',
  styleUrl: './toggle-field.css',
})
export class ToggleField {
  private readonly directive = inject(ToggleFieldDirective, { optional: true });
  private readonly inputSlot = viewChild<ElementRef>('inputSlot');

  protected readonly isRead = computed(() => (this.directive?.mode() ?? 'read') === 'read');

  protected readonly hasInput = computed(
    () => (this.inputSlot()?.nativeElement?.childElementCount ?? 0) > 0,
  );

  protected readonly showValue = computed(() => this.isRead() || !this.hasInput());

  protected readonly valueMuted = computed(() => !this.isRead() && !this.hasInput());
}
