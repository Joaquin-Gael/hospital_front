import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((error) => {
  logCriticalError('Application bootstrap failed', error);
  throw error;
});

/**
 * Logger de emergencia para errores críticos que ocurren antes
 * de que el sistema de DI esté disponible
 */
function logCriticalError(message: string, error: unknown): void {
  console.error(`[CRITICAL] ${message}`, error);
}