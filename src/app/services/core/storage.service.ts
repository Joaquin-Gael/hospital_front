import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly STORAGE_KEY_TOKEN = 'auth_token';
  private readonly STORAGE_KEY_REFRESH_TOKEN = 'refresh_token';
  private readonly STORAGE_KEY_EMAIL = 'rememberEmail';

  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_TOKEN);
  }

  setToken(token: string): void {
    localStorage.setItem(this.STORAGE_KEY_TOKEN, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.STORAGE_KEY_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_REFRESH_TOKEN);
  }

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.STORAGE_KEY_REFRESH_TOKEN, refreshToken);
  }

  removeRefreshToken(): void {
    localStorage.removeItem(this.STORAGE_KEY_REFRESH_TOKEN);
  }

  getRememberEmail(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_EMAIL);
  }

  setRememberEmail(email: string): void {
    localStorage.setItem(this.STORAGE_KEY_EMAIL, email);
  }

  removeRememberEmail(): void {
    localStorage.removeItem(this.STORAGE_KEY_EMAIL);
  }

  clearStorage(): void {
    this.removeToken();
    this.removeRefreshToken();
    this.removeRememberEmail();
  }
}