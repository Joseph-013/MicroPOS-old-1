import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AssetsService } from './services/assets-service';

export const appConfig: ApplicationConfig = {
  providers: [
    // provideSpartanHlm(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(() => {
      const assetsService = inject(AssetsService);
      return assetsService.initialize();
    }),
  ],
};
