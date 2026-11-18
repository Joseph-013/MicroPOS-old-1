import { BooleanInput } from '@angular/cdk/coercion';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX } from '@ng-icons/lucide';
import {
  BrnAutocompleteAnchor,
  BrnAutocompleteClear,
  BrnAutocompleteInput,
} from '@spartan-ng/brain/autocomplete';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';

@Component({
  selector: 'hlm-autocomplete-input',
  imports: [
    HlmInputGroupImports,
    NgIcon,
    BrnAutocompleteAnchor,
    BrnAutocompleteClear,
    BrnAutocompleteInput,
  ],
  providers: [provideIcons({ lucideSearch, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-input-group brnAutocompleteAnchor class="w-auto">
      <input
        brnAutocompleteInput
        #autocompleteInput="brnAutocompleteInput"
        hlmInputGroupInput
        [id]="inputId()"
        [placeholder]="placeholder()"
        [aria-invalid]="ariaInvalidOverride()"
        [forceInvalid]="forceInvalid()"
        (focus)="onFocus.emit()"
        (blur)="onBlur.emit()"
      />

      @if (showSearch()) {
        <hlm-input-group-addon>
          <ng-icon name="lucideSearch" [class.opacity-50]="autocompleteInput.disabled()" />
        </hlm-input-group-addon>
      }

      @if (showClear()) {
        <hlm-input-group-addon align="inline-end">
          <button
            *brnAutocompleteClear
            hlmInputGroupButton
            data-slot="autocomplete-clear"
            [disabled]="autocompleteInput.disabled()"
            size="icon-xs"
            variant="ghost"
          >
            <ng-icon name="lucideX" />
          </button>
        </hlm-input-group-addon>
      }
      <ng-content />
    </hlm-input-group>
  `,
})
export class HlmAutocompleteInput {
  private static _id = 0;

  protected readonly inputEl = viewChild('autocompleteInput', {
    read: ElementRef as new (...args: any[]) => ElementRef<HTMLInputElement>,
  });

  public readonly inputId = input<string>(`hlm-autocomplete-input-${HlmAutocompleteInput._id++}`);

  public readonly placeholder = input<string>('');

  public readonly onFocus = output<void>();
  public readonly onBlur = output<void>();

  public readonly showSearch = input<boolean, BooleanInput>(true, { transform: booleanAttribute });
  public readonly showClear = input<boolean, BooleanInput>(false, { transform: booleanAttribute });

  /** Forces the invalid state visually, regardless of form control state. */
  public readonly forceInvalid = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });

  /** Manual override for aria-invalid. When not set, auto-detects from the parent autocomplete error state. */
  public readonly ariaInvalidOverride = input<boolean | undefined, BooleanInput>(undefined, {
    transform: (v: BooleanInput) => (v === '' || v === undefined ? undefined : booleanAttribute(v)),
    alias: 'aria-invalid',
  });

  public pasteValue(text: string): void {
    console.log('Emulating paste for:', text);
    const el = this.inputEl()?.nativeElement;
    if (!el) {
      console.warn('Input element reference not found.');
      return;
    }

    // 1. Force structural focus so state layers acknowledge the element
    el.focus();

    // 2. Explicitly assign the value to the DOM node first
    el.value = text;

    // 3. Dispatch 'input' with both bubbles and compose flags
    // This ensures it cuts through Shadow DOM and directive boundaries
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    // 4. Construct a highly realistic synthetic ClipboardEvent
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);

    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer,
    });

    // 5. Fire the paste event so Spartan's interceptors wake up
    el.dispatchEvent(pasteEvent);

    // 6. Finalize the interaction loop
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
