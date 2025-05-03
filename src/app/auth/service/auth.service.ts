import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, UserResponse } from '../../pages/user-panel/models/user.model';

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

  login(credentials: { email: string; password: string }): Observable<{ access_token: string; refresh_token: string }> {
    return this.apiService.post<{ access_token: string; refresh_token: string }>('auth/login', credentials).pipe(
      tap(response => {
        if (response.access_token && response.refresh_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          localStorage.setItem(this.refreshTokenKey, response.refresh_token);
        }
      }),
      catchError((err) => {
        if (err.message === 'UUID not available') {
          return throwError(() => new Error('UUID not available'));
        }
        return throwError(() => err);
      })
    );
  }

  getUser(): Observable<User | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }
    return this.apiService.get<UserResponse>('users/me').pipe(
      tap(response => console.log('Raw response from users/me:', response)), // Depuración
      map(response => {
        if (!response || !response.user) {
          return null;
        }
        return {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          is_active: response.user.is_active,
          is_admin: response.user.is_admin,
          is_superuser: response.user.is_superuser,
          last_login: response.user.last_login,
          date_joined: response.user.date_joined,
          dni: response.user.dni,
          telephone: response.user.telephone, 
        } as User;
      }),
      catchError((err) => {
        console.error('Error fetching user:', err);
        return of(null);
      })
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
}