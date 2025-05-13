import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly APP_PREFIX = '[MedicalApp]';

  error(message: string, error?: unknown): void {
    console.error(`${this.APP_PREFIX} ${message}`, error);
  }

  warn(message: string, data?: unknown): void {
    console.warn(`${this.APP_PREFIX} ${message}`, data);
  }

  info(message: string, data?: unknown): void {
    console.info(`${this.APP_PREFIX} ${message}`, data);
  }
}