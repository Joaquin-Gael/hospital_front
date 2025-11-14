import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly STORAGE_KEY_EMAIL = 'rememberEmail';
  private readonly TEMP_RESET_EMAIL_KEY = 'temp_reset_email';
  private readonly SCOPES_KEY = 'scopes';

  private readonly logger = inject(LoggerService);

  getToken(key: string): string | null {
    return this.withStorage(
      'local',
      `getToken(${key})`,
      (storage) => storage.getItem(key),
      () => null
    );
  }

  setToken(key: string, token: string): boolean {
    return this.withStorage(
      'local',
      `setToken(${key})`,
      (storage) => {
        storage.setItem(key, token);
        return true;
      },
      () => false
    );
  }

  removeToken(key: string): boolean {
    return this.withStorage(
      'local',
      `removeToken(${key})`,
      (storage) => {
        storage.removeItem(key);
        return true;
      },
      () => false
    );
  }

  getAccessToken(): string | null {
    return this.getToken(this.ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): boolean {
    return this.setToken(this.ACCESS_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return this.getToken(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): boolean {
    return this.setToken(this.REFRESH_TOKEN_KEY, token);
  }

  removeTokens(): boolean {
    const removedAccess = this.removeToken(this.ACCESS_TOKEN_KEY);
    const removedRefresh = this.removeToken(this.REFRESH_TOKEN_KEY);
    return removedAccess && removedRefresh;
  }

  getRememberEmail(): string | null {
    return this.getItem(this.STORAGE_KEY_EMAIL);
  }

  setRememberEmail(email: string): boolean {
    return this.setItem(this.STORAGE_KEY_EMAIL, email);
  }

  removeRememberEmail(): boolean {
    return this.removeItem(this.STORAGE_KEY_EMAIL);
  }

  setTempResetEmail(email: string): boolean {
    return this.withStorage(
      'session',
      `setTempResetEmail(${email})`,
      (storage) => {
        storage.setItem(this.TEMP_RESET_EMAIL_KEY, email);
        return true;
      },
      () => false
    );
  }

  getTempResetEmail(): string | null {
    return this.withStorage(
      'session',
      'getTempResetEmail()',
      (storage) => storage.getItem(this.TEMP_RESET_EMAIL_KEY),
      () => null
    );
  }

  removeTempResetEmail(): boolean {
    return this.withStorage(
      'session',
      'removeTempResetEmail()',
      (storage) => {
        storage.removeItem(this.TEMP_RESET_EMAIL_KEY);
        return true;
      },
      () => false
    );
  }

  setItem(key: string, value: string): boolean {
    return this.setToken(key, value);
  }

  getItem(key: string): string | null {
    return this.getToken(key);
  }

  removeItem(key: string): boolean {
    return this.removeToken(key);
  }

  clearStorage(): boolean {
    const results = [
      this.removeTokens(),
      this.removeRememberEmail(),
      this.removeItem(this.SCOPES_KEY),
      this.clearAllTempData(),
    ];

    return results.every(Boolean);
  }

  clearAllTempData(): boolean {
    return this.removeTempResetEmail();
  }

  private getStorage(type: 'local' | 'session'): Storage | null {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    const target =
      type === 'local'
        ? (globalThis as { localStorage?: Storage }).localStorage
        : (globalThis as { sessionStorage?: Storage }).sessionStorage;

    return target ?? null;
  }

  private withStorage<T>(
    type: 'local' | 'session',
    context: string,
    operation: (storage: Storage) => T,
    fallback: () => T
  ): T {
    try {
      const storage = this.getStorage(type);

      if (!storage) {
        this.logger.warn(`${context}: ${type}Storage is unavailable.`);
        return fallback();
      }

      return operation(storage);
    } catch (error) {
      this.logger.warn(`${context}: Failed to access ${type}Storage.`, error);
      return fallback();
    }
  }
}
