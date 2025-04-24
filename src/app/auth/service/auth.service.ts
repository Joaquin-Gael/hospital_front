import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/auth/login';
  private userMeUrl = 'http://127.0.0.1:8000/users/me';
  private logoutUrl = 'http://127.0.0.1:8000/auth/logout';
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  login(loginObj: { email: string; password: string }): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(this.apiUrl, loginObj).pipe(
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
    return this.http.get<any>(this.userMeUrl).pipe(
      catchError(() => of(null))
    );
  }

  logout(): Observable<void> {
    if (!this.isLoggedIn()) {
      localStorage.removeItem(this.tokenKey);
      return of(undefined);
    }
    return this.http.post<void>(this.logoutUrl, {}).pipe(
      tap(() => localStorage.removeItem(this.tokenKey)),
      catchError(() => {
        localStorage.removeItem(this.tokenKey);
        return of(undefined);
      })
    );
  }
}