import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly STORAGE_KEY_EMAIL = 'rememberEmail';
  private readonly TEMP_RESET_EMAIL_KEY = 'temp_reset_email'; 
  private readonly SCOPES_KEY = 'scopes';

  getRememberEmail(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_EMAIL);
  }

  setRememberEmail(email: string): void {
    localStorage.setItem(this.STORAGE_KEY_EMAIL, email);
  }

  removeRememberEmail(): void {
    localStorage.removeItem(this.STORAGE_KEY_EMAIL);
  }

  setTempResetEmail(email: string): void {
    try {
      sessionStorage.setItem(this.TEMP_RESET_EMAIL_KEY, email);
    } catch (error) {
      console.warn('No se pudo guardar el email temporal en sessionStorage:', error);
    }
  }

  getTempResetEmail(): string | null {
    try {
      return sessionStorage.getItem(this.TEMP_RESET_EMAIL_KEY);
    } catch (error) {
      console.warn('No se pudo leer el email temporal desde sessionStorage:', error);
      return null;
    }
  }

  removeTempResetEmail(): void {
    try {
      sessionStorage.removeItem(this.TEMP_RESET_EMAIL_KEY);
    } catch (error) {
      console.warn('No se pudo eliminar el email temporal desde sessionStorage:', error);
    }
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Nuevo: Limpia solo scopes (para auth/logout)
  clearScopes(): void {
    this.removeItem(this.SCOPES_KEY);
  }

  clearStorage(): void {
    this.removeRememberEmail();
    this.clearScopes();
    this.clearAllTempData();
  }

  clearAllTempData(): void {
    this.removeTempResetEmail();
  }
}