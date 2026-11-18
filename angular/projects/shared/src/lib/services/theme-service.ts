import { computed, effect, inject, Service, signal } from '@angular/core';
import { ColorTheme } from '../types/color-theme';
import { SettingsService } from './settings-service';

@Service()
export class ThemeService {
  private readonly settings = inject(SettingsService);

  private readonly _colorTheme = signal<ColorTheme | null>(null);
  readonly theme = this._colorTheme.asReadonly();
  readonly isDark = computed(() => this._colorTheme() === 'dark');

  constructor() {
    this.initializeTheme();

    effect(() => {
      const theme = this._colorTheme();
      document.documentElement.classList.remove('light', 'dark');
      if (theme) {
        document.documentElement.classList.add(theme);
        this.settings.set('color-theme', theme).catch((err) => {
          console.error('Failed to persist theme:', err);
        });
      }
    });
  }

  private async initializeTheme(): Promise<void> {
    const savedTheme = (await this.settings.get<ColorTheme>('color-theme')) ?? 'dark';
    this._colorTheme.set(savedTheme);
  }

  toggleColorTheme(): void {
    this._colorTheme.update((prev) => (prev === 'light' ? 'dark' : 'light'));
  }

  setColorTheme(colorTheme: ColorTheme): void {
    this._colorTheme.set(colorTheme);
  }
}
