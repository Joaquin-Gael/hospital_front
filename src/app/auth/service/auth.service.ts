import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service'; 

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'auth_token';

  constructor(private apiService: ApiService) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  login(loginObj: { email: string; password: string }): Observable<{ access_token: string }> {
    return this.apiService.post<{ access_token: string }>('auth/login', loginObj).pipe(
      tap(response => {
        if (response.access_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
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
      return of(undefined);
    }
    return this.apiService.post<void>('auth/logout', {}).pipe(
      tap(() => localStorage.removeItem(this.tokenKey)),
      catchError(() => {
        localStorage.removeItem(this.tokenKey);
        return of(undefined);
      })
    );
  }
}