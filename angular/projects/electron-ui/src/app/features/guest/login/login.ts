import { Component, effect, inject, signal } from '@angular/core';
import { debounce, email, form, FormRoot, required, FormField } from '@angular/forms/signals';
import { GuestLayout } from '../../../shared/components/guest-layout/guest-layout';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff, lucideLogIn } from '@ng-icons/lucide';
import { Router } from '@angular/router';
import { Logo } from '@angular-shared';

interface LoginData {
  username: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [
    HlmCardImports,
    FormRoot,
    HlmFieldImports,
    HlmInputImports,
    FormField,
    HlmButtonImports,
    HlmInputGroupImports,
    NgIcon,
    Logo,
  ],
  viewProviders: [provideIcons({ lucideEye, lucideEyeOff, lucideLogIn })],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  protected readonly passwordVisible = signal(false);
  private readonly router = inject(Router);

  private readonly loginModel = signal<LoginData>({
    username: 'user123',
    password: 'password',
  });

  readonly loginForm = form(
    this.loginModel,
    (schemaPath) => {
      debounce(schemaPath.username, 500);
      required(schemaPath.username, { message: 'Required' });
      required(schemaPath.password, { message: 'Required' });
    },
    {
      submission: {
        action: async () => {
          this.router.navigateByUrl('/authenticated/checkout', { replaceUrl: true });
        },
      },
    },
  );

  reset() {
    this.loginForm().reset();
  }

  togglePasswordVisibility(visible?: boolean) {
    if (visible !== undefined) {
      this.passwordVisible.set(visible);
      return;
    }
    this.passwordVisible.update((prev) => !prev);
  }
}
