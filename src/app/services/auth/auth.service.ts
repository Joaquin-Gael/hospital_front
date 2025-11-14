import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, of, throwError, startWith } from 'rxjs';
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
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '../core/api.tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private loginStatusSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  loginStatus$ = this.loginStatusSubject.asObservable();

  isLoggedIn(): boolean {
    return !!this.storage.getAccessToken();
  }

  login(credentials: Auth): Observable<TokenUserResponse> {
    let params = new HttpParams()
      .set('email', credentials.email)
      .set('password', credentials.password);
    return this.apiService
      .post<TokenUserResponse>(AUTH_ENDPOINTS.LOGIN, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        switchMap((response) => {
          this.persistSessionTokens(response.access_token, response.refresh_token, 'login');
          return this.hydrateScopes(response);
        }),
        catchError((error: HttpErrorResponse) => this.handleError('User Login', error))
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
    return this.apiService.post<TokenUserResponse>(url, { code }).pipe(
      switchMap((response) => {
        this.logger.debug('Token recibido:', response.access_token);
        this.persistSessionTokens(response.access_token, response.refresh_token, 'OAuth login');
        return this.hydrateScopes(response);
      }),
      catchError((error: HttpErrorResponse) => this.handleError('OAuth Code Exchange', error))
    );
  }

  decode(code: string): Observable<DecodeResponse> {
    this.logger.debug('Decodificando código secreto');
    return this.apiService.post<DecodeResponse>(AUTH_ENDPOINTS.DECODE, { code }).pipe(
      switchMap((response) => {
        this.logger.debug('Access token recibido:', response.access_token);
        this.persistSessionTokens(response.access_token, null, 'code decode');
        return this.hydrateScopes(response);
      }),
      catchError((error: HttpErrorResponse) => this.handleError('Decode Code', error))
    );
  }

  storeAccessToken(accessToken: string): Observable<void> {
    this.logger.debug('Almacenando access_token:', accessToken);
    const stored = this.storage.setAccessToken(accessToken);
    if (!stored) {
      this.logger.error('No se pudo almacenar el access_token');
      return throwError(() => new Error('No se pudo almacenar el access_token'));
    }
    const storedToken = this.storage.getAccessToken();
    this.logger.debug('Token almacenado correctamente:', storedToken);
    this.loginStatusSubject.next(true);
    return of(void 0);
  }

  doctorLogin(credentials: Auth): Observable<TokenDoctorsResponse> {
    let params = new HttpParams()
      .set('email', credentials.email)
      .set('password', credentials.password);
    return this.apiService
      .post<TokenDoctorsResponse>(AUTH_ENDPOINTS.DOC_LOGIN, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        switchMap((response) => {
          this.persistSessionTokens(response.access_token, response.refresh_token, 'doctor login');
          return this.hydrateScopes(response);
        }),
        catchError((error: HttpErrorResponse) => this.handleError('Doctor Login', error))
      );
  }

  getUser(): Observable<UserRead | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }
    return this.apiService.get<{ user: UserRead }>(AUTH_ENDPOINTS.ME).pipe(
      map((response) => response?.user ?? null),
      catchError(() => of(null))
    );
  }

  logout(): Observable<void> {
    if (!this.isLoggedIn()) {
      this.clearSession();
      return of(void 0);
    }
    return this.apiService.delete<void>(AUTH_ENDPOINTS.LOGOUT).pipe(
      tap(() => {
        this.clearSession();
      }),
      map(() => void 0),
      catchError((error) => {
        this.logger.warn('Logout request failed', error);
        this.clearSession();
        return of(void 0);
      })
    );
  }

  refreshToken(): Observable<TokenUserResponse> {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      this.logger.error('No refresh token available ')
    }

    const options = {
      headers: { Authorization: `Bearer ${refreshToken}` }
    }

    return this.apiService.get<TokenUserResponse>(AUTH_ENDPOINTS.REFRESH, options).pipe(
      tap((response) => {
        this.persistSessionTokens(response.access_token, response.refresh_token, 'refresh');
      }),
      catchError((error: HttpErrorResponse) => this.handleError('Refresh token', error))
    );
  }

  getScopes(): Observable<string[]> {
    return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES).pipe(
      map((response) => response.scopes),
      catchError(() => of([]))
    );
  }

  setScopes(scopes: string[]): void {
    const stored = this.storage.setItem('scopes', JSON.stringify(scopes));
    if (!stored) {
      this.logger.warn('Scopes could not be stored');
    }
  }

  getStoredScopes(): string[] {
    const scopes = this.storage.getItem('scopes');
    return scopes ? JSON.parse(scopes) : [];
  }

  private hydrateScopes<T>(response: T): Observable<T> {
    return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES).pipe(
      tap({
        next: (scopesResponse) => {
          this.setScopes(scopesResponse.scopes);
        },
        error: () => {
          this.setScopes([]);
        },
      }),
      map(() => response),
      startWith(response),
      catchError(() => EMPTY)
    );
  }

  private persistSessionTokens(accessToken: string, refreshToken: string | null | undefined, context: string): void {
    const accessStored = this.storage.setAccessToken(accessToken);
    let refreshStored = true;

    if (refreshToken) {
      refreshStored = this.storage.setRefreshToken(refreshToken);
    }

    if (!accessStored || !refreshStored) {
      this.logger.warn(`Tokens could not be stored after ${context}`);
    }

    this.loginStatusSubject.next(true);
  }

  private clearSession(): void {
    this.storage.clearStorage();
    this.loginStatusSubject.next(false);
  }

  private extractErrorDetail(payload: unknown): string | undefined {
    if (typeof payload === 'string') {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      if ('detail' in payload && typeof (payload as { detail: unknown }).detail === 'string') {
        return (payload as { detail: string }).detail;
      }

      if ('message' in payload && typeof (payload as { message: unknown }).message === 'string') {
        return (payload as { message: string }).message;
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