import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
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
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly logger = inject(LoggerService);

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
          this.storage.setAccessToken(response.access_token);
          this.storage.setRefreshToken(response.refresh_token);
          this.loginStatusSubject.next(true);
          // Obtener y guardar scopes después del login
          return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES).pipe(
            tap((scopesResponse) => {
              this.setScopes(scopesResponse.scopes);
            }),
            map(() => response), // Devolvemos la respuesta original
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
    return this.apiService.post<TokenUserResponse>(url, { code }).pipe(
      switchMap((response) => {
        this.logger.debug('Token recibido:', response.access_token);
        this.storage.setAccessToken(response.access_token);
        if (response.refresh_token) {
          this.storage.setRefreshToken(response.refresh_token);
        }
        this.loginStatusSubject.next(true);
        // Obtener y guardar scopes después del login
        return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES).pipe(
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
    return this.apiService.post<DecodeResponse>(AUTH_ENDPOINTS.DECODE, { code }).pipe(
      switchMap((response) => {
        this.logger.debug('Access token recibido:', response.access_token);
        this.storage.setAccessToken(response.access_token);
        this.loginStatusSubject.next(true);
        // Obtener y guardar scopes después del login
        return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES).pipe(
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

  storeAccessToken(accessToken: string): Observable<void> {
    this.logger.debug('Almacenando access_token:', accessToken);
    this.storage.setAccessToken(accessToken);
    const storedToken = this.storage.getAccessToken();
    if (!storedToken) {
      this.logger.error('No se pudo almacenar el access_token');
      return throwError(() => new Error('No se pudo almacenar el access_token'));
    }
    this.logger.debug('Token almacenado correctamente:', storedToken);
    this.loginStatusSubject.next(true);
    return of(undefined);
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
          this.storage.setAccessToken(response.access_token);
          this.storage.setRefreshToken(response.refresh_token);
          this.loginStatusSubject.next(true);
          // Obtener y guardar scopes después del login
          return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES).pipe(
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
    return this.apiService.get<{ user: UserRead }>(AUTH_ENDPOINTS.ME).pipe(
      map((response) => response?.user ?? null),
      catchError(() => of(null))
    );
  }

  logout(): Observable<void> {
    if (!this.isLoggedIn()) {
      this.storage.clearStorage();
      this.loginStatusSubject.next(false);
      return of(undefined);
    }
    return this.apiService.delete<void>(AUTH_ENDPOINTS.LOGOUT).pipe(
      tap(() => {
        this.storage.clearStorage();
        this.loginStatusSubject.next(false);
      }),
      catchError(() => {
        this.storage.clearStorage();
        this.loginStatusSubject.next(false);
        return of(undefined);
      })
    );
  }

  refreshToken(): Observable<TokenUserResponse> {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      this.storage.clearStorage();
      this.loginStatusSubject.next(false);
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService.get<TokenUserResponse>(AUTH_ENDPOINTS.REFRESH).pipe(
      tap((response) => {
        this.storage.setAccessToken(response.access_token);
        this.storage.setRefreshToken(response.refresh_token);
        this.loginStatusSubject.next(true);
      }),
      catchError((error) => this.handleError('Refresh token', error))
    );
  }

  getScopes(): Observable<string[]> {
    return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES).pipe(
      map((response) => response.scopes),
      catchError(() => of([]))
    );
  }

  setScopes(scopes: string[]): void {
    this.storage.setItem('scopes', JSON.stringify(scopes));
  }

  getStoredScopes(): string[] {
    const scopes = this.storage.getItem('scopes');
    return scopes ? JSON.parse(scopes) : [];
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
          this.storage.clearStorage();
          this.loginStatusSubject.next(false);
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