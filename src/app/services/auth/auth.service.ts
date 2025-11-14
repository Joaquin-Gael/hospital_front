import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

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
import { API_BASE_URL } from '../core/api.tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  // 🔐 Estado de sesión y scopes con signals
  private loginStatusSignal = signal<boolean>(false);
  loginStatus$ = computed(() => this.loginStatusSignal());

  private scopesSignal = signal<string[]>(this.loadScopesFromStorage());
  scopes$ = computed(() => this.scopesSignal());

  // 👉 Scopes desde storage al iniciar
  private loadScopesFromStorage(): string[] {
    const s = this.storage.getItem('scopes');
    return s ? JSON.parse(s) : [];
  }

  setLoggedIn(status: boolean): void {
    this.loginStatusSignal.set(status);
  }

  isLoggedIn(): boolean {
    return this.loginStatusSignal();
  }

  // ========= COOKIES & CSRF HELPERS =========

  private readCookie(name: string): string | null {
    const cookies = `; ${document.cookie || ''}`;
    const parts = cookies.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  // Candidatos para cookie de CSRF
  private getCsrfTokenFromCookies(): string | null {
    const candidates = ['csrf_token', 'csrftoken', 'csrf'];
    for (const name of candidates) {
      const v = this.readCookie(name);
      if (v) return v;
    }
    return null;
  }

  // Headers para endpoints sensibles (refresh/logout)
  private getHeadersForSensitive(csrf: boolean = false): HttpHeaders {
    if (!csrf) return new HttpHeaders();
    const csrfToken = this.getCsrfTokenFromCookies();
    return csrfToken
      ? new HttpHeaders().set('X-CSRF-Token', csrfToken)
      : new HttpHeaders();
  }

  // 👉 Usado por el interceptor para leer token desde cookies
  getAccessTokenFromCookie(): string {
    const candidates = ['access_token', 'accessToken', 'access'];
    for (const n of candidates) {
      const v = this.readCookie(n);
      if (v) return v;
    }
    return '';
  }

  // ========= AUTH FLOWS =========

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
          return this.hydrateScopes(response);
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError('User Login', error)
        )
      );
  }

  oauthLogin(service: string): void {
    const url = `${this.apiBaseUrl}${AUTH_ENDPOINTS.OAUTH_LOGIN(service)}`;
    this.logger.debug(`Redirigiendo a OAuth para ${service}: ${url}`);
    window.location.href = url;
  }

  exchangeCodeForToken(code: string): Observable<TokenUserResponse> {
    const url = `${this.apiBaseUrl}/api/oauth/google`;
    this.logger.debug(`Intercambiando código en: ${url}`);

    return this.apiService
      .post<TokenUserResponse>(
        url,
        { code },
        {
          withCredentials: true
        }
      )
      .pipe(
        switchMap((response) => {
          this.logger.debug('Token recibido:', response.access_token);
          this.setLoggedIn(true);
          return this.hydrateScopes(response);
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError('OAuth Code Exchange', error)
        )
      );
  }

  decode(code: string): Observable<DecodeResponse> {
    this.logger.debug('Decodificando código secreto');
    return this.apiService
      .post<DecodeResponse>(
        AUTH_ENDPOINTS.DECODE,
        { code },
        {
          withCredentials: true
        }
      )
      .pipe(
        switchMap((response) => {
          this.logger.debug('Access token recibido:', response.access_token);
          this.setLoggedIn(true);
          return this.hydrateScopes(response);
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError('Decode Code', error)
        )
      );
  }

  /**
   * Compatibilidad con código viejo que esperaba guardar access_token.
   * En modo cookies NO guardamos nada, solo marcamos loggedIn.
   */
  storeAccessToken(accessToken: string): Observable<void> {
    this.logger.debug(
      'storeAccessToken llamado en modo cookies, token ignorado.',
      accessToken
    );
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
          return this.hydrateScopes(response);
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleError('Doctor Login', error)
        )
      );
  }

  getUser(): Observable<UserRead | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }
    return this.apiService
      .get<{ user: UserRead }>(AUTH_ENDPOINTS.ME, {
        withCredentials: true
      })
      .pipe(
        map((response) => response?.user ?? null),
        catchError(() => of(null))
      );
  }

  logout(): Observable<void> {
    if (!this.isLoggedIn()) {
      this.clearSession();
      return of(undefined);
    }

    return this.apiService
      .delete<void>(AUTH_ENDPOINTS.LOGOUT, {
        withCredentials: true,
        headers: this.getHeadersForSensitive(true)
      })
      .pipe(
        tap(() => {
          this.clearSession();
        }),
        catchError((error: HttpErrorResponse) => {
          this.logger.warn('Logout request failed', error);
          this.clearSession();
          return of(undefined);
        })
      );
  }

  refreshToken(): Observable<TokenUserResponse> {
    return this.apiService
      .get<TokenUserResponse>(AUTH_ENDPOINTS.REFRESH, {
        withCredentials: true,
        headers: this.getHeadersForSensitive(true)
      })
      .pipe(
        tap(() => {
          this.setLoggedIn(true);
        }),
        catchError((error: HttpErrorResponse) => {
          this.setLoggedIn(false);
          this.clearSession();
          return this.handleError('Refresh token', error);
        })
      );
  }

  // ========= SCOPES =========

  getScopes(): Observable<string[]> {
    return this.apiService
      .get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES, {
        withCredentials: true
      })
      .pipe(
        map((response) => response.scopes),
        catchError(() => of([]))
      );
  }

  setScopes(scopes: string[]): void {
    const safeScopes = scopes || [];
    this.scopesSignal.set(safeScopes);
    this.storage.setItem('scopes', JSON.stringify(safeScopes));
  }

  getStoredScopes(): string[] {
    return this.scopesSignal();
  }

  /**
   * Helper para hidratar scopes después de cualquier flujo de login.
   */
  private hydrateScopes<T>(response: T): Observable<T> {
    return this.apiService
      .get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES, {
        withCredentials: true
      })
      .pipe(
        tap({
          next: (scopesResponse) => {
            this.setScopes(scopesResponse.scopes);
          },
          error: () => {
            this.setScopes([]);
          }
        }),
        map(() => response),
        catchError(() => {
          // Si falla scopes, no rompemos el login, solo limpiamos scopes
          this.setScopes([]);
          return of(response);
        })
      );
  }

  // ========= SESSION & ERRORES =========

  private clearSession(): void {
    if (this.storage.clearStorage) {
      this.storage.clearStorage();
    }
    this.setLoggedIn(false);
    this.setScopes([]);
  }

  private extractErrorDetail(payload: unknown): string | undefined {
    if (typeof payload === 'string') {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      if ('detail' in payload && typeof (payload as any).detail === 'string') {
        return (payload as any).detail;
      }

      if ('message' in payload && typeof (payload as any).message === 'string') {
        return (payload as any).message;
      }
    }

    return undefined;
  }

  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    this.logger.error(`${operation} failed`, error);

    const backendMessage = this.extractErrorDetail(error.error);
    let errorMessage = 'Ocurrió un error inesperado';

    switch (error.status) {
      case 400:
        errorMessage = backendMessage ?? 'Datos de solicitud inválidos';
        break;
      case 401:
      case 403:
        errorMessage = backendMessage ?? 'Credenciales inválidas';
        this.clearSession();
        break;
      case 404:
        errorMessage = backendMessage ?? 'Recurso no encontrado';
        break;
      default:
        errorMessage = backendMessage ?? 'Error del servidor';
        break;
    }

    return throwError(() => new Error(errorMessage));
  }
}