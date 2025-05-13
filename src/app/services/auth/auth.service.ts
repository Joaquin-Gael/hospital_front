import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { AUTH_ENDPOINTS } from './auth-endpoints';
import { UserAuth, TokenUserResponse, ScopesResponse, UserRead } from '../interfaces/user.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly apiService: ApiService,
    private readonly logger: LoggerService,
    private readonly storage: StorageService
  ) {}

  /**
   * Verifica si el usuario está autenticado.
   * @returns true si hay un token válido, false en caso contrario.
   */
  isLoggedIn(): boolean {
    return !!this.storage.getToken();
  }

  /**
   * Inicia sesión con las credenciales proporcionadas.
   * @param credentials Credenciales del usuario (username, password).
   * @returns Observable con la respuesta de autenticación (tokens).
   */
  login(credentials: UserAuth): Observable<TokenUserResponse> {
    return this.apiService.post<TokenUserResponse>(AUTH_ENDPOINTS.LOGIN, credentials).pipe(
      tap(response => {
        if (response.access_token && response.refresh_token) {
          this.storage.setToken(response.access_token);
          this.storage.setRefreshToken(response.refresh_token);
        }
      }),
      catchError(error => this.handleError('Login', error))
    );
  }

  /**
   * Obtiene los datos del usuario autenticado.
   * @returns Observable con los datos del usuario o null si no está autenticado.
   */
  getUser(): Observable<UserRead | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }
    return this.apiService.get<{ user: UserRead }>(AUTH_ENDPOINTS.ME).pipe(
      map(response => response?.user ?? null),
      catchError(() => of(null))
    );
  }

  /**
   * Cierra la sesión del usuario.
   * @returns Observable que completa al cerrar sesión.
   */
  logout(): Observable<void> {
    if (!this.isLoggedIn()) {
      this.storage.clearStorage();
      return of(undefined);
    }
    return this.apiService.delete<void>(AUTH_ENDPOINTS.LOGOUT).pipe(
      tap(() => this.storage.clearStorage()),
      catchError(() => {
        this.storage.clearStorage();
        return of(undefined);
      })
    );
  }

  /**
   * Refresca el token de acceso usando el refresh token.
   * @returns Observable con los nuevos tokens.
   */
  refreshToken(): Observable<TokenUserResponse> {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      this.storage.clearStorage();
      return throwError(() => new Error('No refresh token available'));
    }
    return this.apiService.get<TokenUserResponse>(AUTH_ENDPOINTS.REFRESH).pipe(
      tap(response => {
        if (response.access_token && response.refresh_token) {
          this.storage.setToken(response.access_token);
          this.storage.setRefreshToken(response.refresh_token);
        }
      }),
      catchError(error => this.handleError('Refresh token', error))
    );
  }

  /**
   * Obtiene los scopes del usuario autenticado.
   * @returns Observable con la lista de scopes.
   */
  getScopes(): Observable<string[]> {
    return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES).pipe(
      map(response => response.scopes),
      catchError(() => of([]))
    );
  }

  /**
   * Maneja errores de las peticiones HTTP.
   * @param operation Nombre de la operación que falló.
   * @param error Objeto de error.
   * @returns Observable con el error transformado.
   */
  private handleError(operation: string, error: unknown): Observable<never> {
    this.logger.error(`${operation} failed`, error);

    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'status' in error) {
      const httpError = error as { status: number; error?: { detail?: string } };
      switch (httpError.status) {
        case 400:
          errorMessage = httpError.error?.detail ?? 'Invalid request data';
          break;
        case 401:
          errorMessage = httpError.error?.detail ?? 'Unauthorized access';
          this.storage.clearStorage();
          break;
        case 403:
          errorMessage = httpError.error?.detail ?? 'Forbidden action';
          break;
        case 404:
          errorMessage = httpError.error?.detail ?? 'Resource not found';
          break;
        default:
          errorMessage = httpError.error?.detail ?? 'Server error';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}