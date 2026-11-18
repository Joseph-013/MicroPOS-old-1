import { ThemeService } from '@angular-shared';
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun, lucideSunMoon } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';

@Component({
  selector: 'app-settings',
  imports: [
    HlmFieldImports,
    HlmButtonImports,
    RouterOutlet,
    RouterLinkWithHref,
    NgIcon,
    HlmSeparatorImports,
  ],
  viewProviders: [provideIcons({ lucideMoon, lucideSunMoon, lucideSun })],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  readonly themeService = inject(ThemeService);
}
