import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { UserAuth, TokenUserResponse, ScopesResponse, UserRead } from './interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly endpoints = {
    login: 'auth/login',
    refresh: 'auth/refresh',
    logout: 'auth/logout',
    scopes: 'auth/scopes',
    me: 'users/me'
  };

  constructor(private readonly apiService: ApiService) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  login(credentials: UserAuth): Observable<TokenUserResponse> {
    return this.apiService.post<TokenUserResponse>(this.endpoints.login, credentials).pipe(
      tap(response => {
        if (response.access_token && response.refresh_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          localStorage.setItem(this.refreshTokenKey, response.refresh_token);
        }
      }),
      catchError(error => this.handleError('login', error))
    );
  }

  getUser(): Observable<UserRead | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }
    return this.apiService.get<{ user: UserRead }>(this.endpoints.me).pipe(
      map(response => response?.user ?? null),
      catchError(() => of(null))
    );
  }

  logout(): Observable<void> {
    if (!this.isLoggedIn()) {
      this.clearTokens();
      return of(undefined);
    }
    return this.apiService.delete<void>(this.endpoints.logout).pipe(
      tap(() => this.clearTokens()),
      catchError(() => {
        this.clearTokens();
        return of(undefined);
      })
    );
  }

  refreshToken(): Observable<TokenUserResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      this.clearTokens();
      return throwError(() => new Error('No refresh token available'));
    }
    return this.apiService.get<TokenUserResponse>(this.endpoints.refresh).pipe(
      tap(response => {
        if (response.access_token && response.refresh_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          localStorage.setItem(this.refreshTokenKey, response.refresh_token);
        }
      }),
      catchError(error => this.handleError('refreshToken', error))
    );
  }

  getScopes(): Observable<string[]> {
    return this.apiService.get<ScopesResponse>(this.endpoints.scopes).pipe(
      map(response => response.scopes),
      catchError(() => of([]))
    );
  }

  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  private handleError(operation: string, error: any): Observable<never> {
    const errorMessage = error.error?.detail || error.message || 'Unknown error';
    console.error(`${operation} failed: ${errorMessage}`);
    if (errorMessage.includes('UUID not available')) {
      return throwError(() => new Error('UUID not available'));
    }
    return throwError(() => new Error(`${operation} failed: ${errorMessage}`));
  }
}