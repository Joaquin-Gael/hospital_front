import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  constructor(private apiService: ApiService) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  login(credentials: { email: string; password: string }): Observable<{ access_token: string, refresh_token: string }> {
    return this.apiService.post<{ access_token: string; refresh_token: string }>('auth/login', credentials).pipe(
      tap(response => {
        if (response.access_token && response.refresh_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          localStorage.setItem(this.refreshTokenKey, response.refresh_token);
          // Generar cookie de sesión
          this.apiService.put('auth/session', {}).subscribe({
            error: (err) => console.error('Error setting session cookie:', err),
          });
        }
      })
    );
  }

  getUser(): Observable<any | null> { 
    if (!this.isLoggedIn()) {
      return of(null);
    }
    return this.apiService.get<any>('users/me').pipe(
      catchError(() => of(null))
    );
  }

  logout(): Observable<void> {
    if (!this.isLoggedIn()) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      return of(undefined);
    }
    return this.apiService.delete<void>('auth/logout').pipe(
      tap(() => {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
      }),
      catchError(() => {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        return of(undefined);
      })
    );
  }

  refreshToken(): Observable<{ access_token: string; refresh_token: string }> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.apiService.get<{ access_token: string; refresh_token: string }>('auth/refresh').pipe(
      tap(response => {
        if (response.access_token && response.refresh_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          localStorage.setItem(this.refreshTokenKey, response.refresh_token);
        }
      }),
      catchError((err) => {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        return throwError(() => err);
      })
    );
  }

  checkSessionStatus(): Observable<{ session: boolean; state: string }> {
    return this.apiService.get<{ session: boolean; state: string }>('auth/session/status').pipe(
      catchError((err) => {
        console.error('Session status check failed:', err);
        return of({ session: false, state: 'no_session' });
      })
    );
  }
}