import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import clsx from 'clsx';

export type LogoSize = (typeof LogoSizes)[number];
export const LogoSizes = ['xxxlarge', 'xxlarge', 'xlarge', 'large', 'default', 'small', 'xsmall'];

@Component({
  selector: 'lib-logo',
  imports: [RouterLink],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class Logo {
  link = input('/');
  size = input<LogoSize>('default');
  sizeClass: Record<LogoSize, string> = {
    xxxlarge: 'text-3xl',
    xxlarge: 'text-2xl',
    xlarge: 'text-xl',
    large: 'text-xl',
    default: 'text-base',
    small: 'text-sm',
    xsmall: 'text-xs',
  };
  class = input<string>('');
  classSig = computed(() => clsx(this.class, this.sizeClass[this.size()]));
}
