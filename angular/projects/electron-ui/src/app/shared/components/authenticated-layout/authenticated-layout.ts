import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive, Router } from '@angular/router';
import { GeneralLayout, Logo } from '@angular-shared';
import { HlmNavigationMenuImports } from '@spartan-ng/helm/navigation-menu';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmButton, HlmButtonImports } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLogOut,
  lucideMenu,
  lucideQrCode,
  lucideSettings,
  lucideUser,
} from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { BrnNavigationMenuImports } from '@spartan-ng/brain/navigation-menu';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';

@Component({
  selector: 'app-authenticated-layout',
  imports: [
    GeneralLayout,
    RouterOutlet,
    RouterLink,
    Logo,
    HlmNavigationMenuImports,
    RouterLinkActive,
    HlmSeparatorImports,
    HlmDropdownMenuImports,
    BrnNavigationMenuImports,
    HlmButton,
    HlmIcon,
    NgIcon,
    HlmAlertDialogImports,

    HlmButtonImports,
  ],
  viewProviders: [
    provideIcons({
      lucideMenu,
      lucideUser,
      lucideLogOut,
      lucideQrCode,
      lucideSettings,
    }),
  ],
  templateUrl: './authenticated-layout.html',
  styleUrl: './authenticated-layout.css',
})
export class AuthenticatedLayout {
  private readonly router = inject(Router);

  logout() {
    this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
