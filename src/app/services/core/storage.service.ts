import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly STORAGE_KEY_EMAIL = 'rememberEmail';
  private readonly SCOPES_KEY = 'scopes';

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  removeTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
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

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clearStorage(): void {
    this.removeTokens();
    this.removeRememberEmail();
    this.removeItem(this.SCOPES_KEY);
  }
}