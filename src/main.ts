import { createEnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { LoggerService } from './app/services/core/logger.service';

bootstrapApplication(AppComponent, appConfig).catch((error) => {
  forwardBootstrapError(error);
  throw error;
});

function forwardBootstrapError(error: unknown): void {
  const injector = createEnvironmentInjector(appConfig.providers ?? [], null);

  try {
    runInInjectionContext(injector, () => {
      const logger = inject(LoggerService);
      logger.error('Error during application bootstrap', error);
    });
  } finally {
    injector.destroy();
  }
}
