import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { AUTH_ENDPOINTS } from './auth-endpoints';
import {
  TokenUserResponse,
  ScopesResponse,
  UserRead,
  DecodeResponse
} from '../interfaces/user.interfaces';
import { Auth } from '../interfaces/hospital.interfaces';
import { TokenDoctorsResponse } from '../interfaces/doctor.interfaces';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly logger = inject(LoggerService);

  private loginStatusSignal = signal<boolean>(false);
  loginStatus$ = computed(() => this.loginStatusSignal());

  private scopesSignal = signal<string[]>(this._loadScopesFromStorage());
  scopes$ = computed(() => this.scopesSignal());

  private _loadScopesFromStorage(): string[] {
    const s = this.storage.getItem('scopes');
    return s ? JSON.parse(s) : [];
  }

  setLoggedIn(status: boolean): void {
    this.loginStatusSignal.set(status);
  }

  isLoggedIn(): boolean {
    return this.loginStatus$();
  }

  private readCookie(name: string): string | null {
    const cookies = `; ${document.cookie || ''}`;
    const parts = cookies.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  // Tries multiple candidate names for CSRF cookie
  private getCsrfTokenFromCookies(): string | null {
    const candidates = ['csrf_token', 'csrftoken', 'csrf'];
    for (const name of candidates) {
      const v = this.readCookie(name);
      if (v) return v;
    }
    return null;
  }

  // header builder for sensitive endpoints (refresh/logout)
  private getHeadersForSensitive(csrf: boolean = false): HttpHeaders {
    if (!csrf) return new HttpHeaders();
    const csrfToken = this.getCsrfTokenFromCookies();
    return csrfToken ? new HttpHeaders().set('X-CSRF-Token', csrfToken) : new HttpHeaders();
  }

  login(credentials: Auth): Observable<TokenUserResponse> {
    const formData = new FormData();
    formData.append('email', credentials.email);
    formData.append('password', credentials.password);
    return this.apiService
      .post<TokenUserResponse>(AUTH_ENDPOINTS.LOGIN, formData, {
        withCredentials: true
      })
      .pipe(
        switchMap((response) => {
          this.setLoggedIn(true);
          return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES, {
            withCredentials: true
          }).pipe(
            tap((scopesResponse) => {
              this.setScopes(scopesResponse.scopes);
            }),
            map(() => response),
            catchError(() => {
              this.setScopes([]);
              return of(response);
            })
          );
        }),
        catchError((error) => this.handleError('User Login', error))
      );
  }

  oauthLogin(service: string): void {
    const url = `http://127.0.0.1:8000${AUTH_ENDPOINTS.OAUTH_LOGIN(service)}`;
    this.logger.debug(`Redirigiendo a OAuth para ${service}: ${url}`);
    window.location.href = url;
  }

  exchangeCodeForToken(code: string): Observable<TokenUserResponse> {
    const url = 'http://127.0.0.1:8000/api/oauth/google';
    this.logger.debug(`Intercambiando código en: ${url}`);
    return this.apiService.post<TokenUserResponse>(url, { code }, {
      withCredentials: true
    }).pipe(
      switchMap((response) => {
        this.logger.debug('Token recibido:', response.access_token);
        this.setLoggedIn(true);
        return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES, {
          withCredentials: true
        }).pipe(
          tap((scopesResponse) => {
            this.setScopes(scopesResponse.scopes);
          }),
          map(() => response),
          catchError(() => {
            this.setScopes([]);
            return of(response);
          })
        );
      }),
      catchError((error) => this.handleError('OAuth Code Exchange', error))
    );
  }

  decode(code: string): Observable<DecodeResponse> {
    this.logger.debug('Decodificando código secreto');
    return this.apiService.post<DecodeResponse>(AUTH_ENDPOINTS.DECODE, { code }, {
      withCredentials: true
    }).pipe(
      switchMap((response) => {
        this.logger.debug('Access token recibido:', response.access_token);
        this.setLoggedIn(true);
        return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES, {
          withCredentials: true
        }).pipe(
          tap((scopesResponse) => {
            this.setScopes(scopesResponse.scopes);
          }),
          map(() => response),
          catchError(() => {
            this.setScopes([]);
            return of(response);
          })
        );
      }),
      catchError((error) => this.handleError('Decode Code', error))
    );
  }

  // Tries multiple cookie names to find access token
  getAccessTokenFromCookie(): string {
    const candidates = ['access_token', 'accessToken', 'access'];
    for (const n of candidates) {
      const v = this.readCookie(n);
      if (v) return v;
    }
    return '';
  }

  storeAccessToken(accessToken: string): Observable<void> {
    this.setLoggedIn(true);
    return of(undefined);
  }

  doctorLogin(credentials: Auth): Observable<TokenDoctorsResponse> {
    const formData = new FormData();
    formData.append('email', credentials.email);
    formData.append('password', credentials.password);
    return this.apiService
      .post<TokenDoctorsResponse>(AUTH_ENDPOINTS.DOC_LOGIN, formData, {
        withCredentials: true
      })
      .pipe(
        switchMap((response) => {
          this.setLoggedIn(true);
          return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES, {
            withCredentials: true
          }).pipe(
            tap((scopesResponse) => {
              this.setScopes(scopesResponse.scopes);
            }),
            map(() => response),
            catchError(() => {
              this.setScopes([]);
              return of(response);
            })
          );
        }),
        catchError((error) => this.handleError('Doctor Login', error))
      );
  }

  getUser(): Observable<UserRead | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }
    return this.apiService.get<{ user: UserRead }>(AUTH_ENDPOINTS.ME, {
      withCredentials: true
    }).pipe(
      map((response) => response?.user ?? null),
      catchError(() => of(null))
    );
  }

  logout(): Observable<void> {
    if (!this.isLoggedIn()) {
      this.storage.clearScopes();
      this.setLoggedIn(false);
      return of(undefined);
    }
    return this.apiService.delete<void>(AUTH_ENDPOINTS.LOGOUT, {
      withCredentials: true,
      headers: this.getHeadersForSensitive(true)
    }).pipe(
      tap(() => {
        this.storage.clearScopes();
        this.setLoggedIn(false);
        this.setScopes([]);
      }),
      catchError(() => {
        this.storage.clearScopes();
        this.setLoggedIn(false);
        this.setScopes([]);
        return of(undefined);
      })
    );
  }

  refreshToken(): Observable<TokenUserResponse> {
    return this.apiService.get<TokenUserResponse>(AUTH_ENDPOINTS.REFRESH, {
      withCredentials: true,
      headers: this.getHeadersForSensitive(true)
    }).pipe(
      tap((response) => {
        this.setLoggedIn(true);
      }),
      catchError((error) => {
        this.setLoggedIn(false);
        return this.handleError('Refresh token', error);
      })
    );
  }

  getScopes(): Observable<string[]> {
    return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES, {
      withCredentials: true
    }).pipe(
      map((response) => response.scopes),
      catchError(() => of([]))
    );
  }

  setScopes(scopes: string[]): void {
    this.scopesSignal.set(scopes || []);
    this.storage.setItem('scopes', JSON.stringify(scopes || []));
  }

  getStoredScopes(): string[] {
    return this.scopesSignal();
  }

  private handleError(operation: string, error: unknown): Observable<never> {
    this.logger.error(`${operation} failed`, error);

    let errorMessage = 'Ocurrió un error inesperado';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error
    ) {
      const httpError = error as {
        status: number;
        error?: { detail?: string };
      };
      switch (httpError.status) {
        case 400:
          errorMessage =
            httpError.error?.detail ?? 'Datos de solicitud inválidos';
          break;
        case 401:
        case 404:
          errorMessage = httpError.error?.detail ?? 'Credenciales inválidas';
          this.storage.clearScopes();
          this.setLoggedIn(false);
          this.setScopes([]);
          break;
        case 403:
          errorMessage = httpError.error?.detail ?? 'Acción no permitida';
          break;
        default:
          errorMessage = httpError.error?.detail ?? 'Error del servidor';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}