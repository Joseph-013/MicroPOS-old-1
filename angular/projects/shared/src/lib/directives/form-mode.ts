import { ToggleFieldMode } from '@angular-shared';
import { Directive, input } from '@angular/core';

@Directive({
  selector: '[toggleFieldMode]',
})
export class ToggleFieldDirective {
  readonly mode = input<ToggleFieldMode>('read', { alias: 'toggleFieldMode' });
}
