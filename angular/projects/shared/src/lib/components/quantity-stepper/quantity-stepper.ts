import { Component, computed, ElementRef, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmButtonGroupImports } from '@spartan-ng/helm/button-group';
import { HlmInputImports } from '@spartan-ng/helm/input';

@Component({
  selector: 'lib-quantity-stepper',
  imports: [HlmButtonImports, HlmButtonGroupImports, HlmInputImports, FormsModule],
  templateUrl: './quantity-stepper.html',
  styleUrl: './quantity-stepper.css',
})
export class QuantityStepper {
  readonly value = input<number>(0);
  readonly min = input<number>(Number.NEGATIVE_INFINITY);
  readonly max = input<number>(Number.POSITIVE_INFINITY);
  readonly steps = input<number[]>([-5, -4, -2, -1, 1, 2, 4, 5]);

  readonly valueChange = output<number>();
  readonly stepperClick = output<{ delta: number; value: number }>();

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('stepperInput');

  private clamp(val: number): number {
    return Math.min(this.max(), Math.max(this.min(), val));
  }

  adjust(delta: number): void {
    const clamped = this.clamp(this.value() + delta);
    this.valueChange.emit(clamped);
    this.stepperClick.emit({ delta, value: clamped });
  }

  onModelChange(val: number | null): void {
    this.valueChange.emit(val === null ? this.min() : this.clamp(val));
  }

  onBlur(event: FocusEvent): void {
    const el = event.target as HTMLInputElement;
    // Change parseInt to parseFloat
    const parsed = parseFloat(el.value);
    this.valueChange.emit(isNaN(parsed) ? this.min() : this.clamp(parsed));
  }

  onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  focus(): void {
    this.inputRef()?.nativeElement.focus();
  }
}
