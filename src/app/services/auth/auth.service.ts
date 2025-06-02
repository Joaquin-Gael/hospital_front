import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { AUTH_ENDPOINTS } from './auth-endpoints';
import { TokenUserResponse, ScopesResponse, UserRead } from '../interfaces/user.interfaces';
import { Auth } from '../interfaces/hospital.interfaces';
import { TokenDoctorsResponse } from '../interfaces/doctor.interfaces';
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
   * Verifica si el usuario o doctor está autenticado.
   * @returns true si hay un token válido, false en caso contrario.
   */
  isLoggedIn(): boolean {
    return !!this.storage.getToken();
  }

  /**
   * Inicia sesión con las credenciales de un usuario.
   * @param credentials Credenciales del usuario (email, password).
   * @returns Observable con la respuesta de autenticación (tokens).
   */
  login(credentials: Auth): Observable<TokenUserResponse> {
    return this.apiService.post<TokenUserResponse>(AUTH_ENDPOINTS.LOGIN, credentials).pipe(
      tap(response => {
        if (response.refresh_token) {
          this.storage.setToken(response.refresh_token);
        }
      }),
      catchError(error => this.handleError('User Login', error))
    );
  }

  /**
   * Inicia sesión con las credenciales de un doctor.
   * @param credentials Credenciales del doctor (email, password).
   * @returns Observable con la respuesta de autenticación (tokens y datos del doctor).
   */
  doctorLogin(credentials: Auth): Observable<TokenDoctorsResponse> {
    return this.apiService.post<TokenDoctorsResponse>(AUTH_ENDPOINTS.DOC_LOGIN, credentials).pipe(
      tap(response => {
        if (response.refresh_token) {
          this.storage.setToken(response.refresh_token);
        }
      }),
      catchError(error => this.handleError('Doctor Login', error))
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
   * Cierra la sesión del usuario o doctor.
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
    const Token = this.storage.getToken();
    if (!Token) {
      this.storage.clearStorage();
      return throwError(() => new Error('No refresh token available'));
    }
    return this.apiService.get<TokenUserResponse>(AUTH_ENDPOINTS.REFRESH).pipe(
      tap(response => {
        if (response.refresh_token) {
          this.storage.setToken(response.refresh_token);
        }
      }),
      catchError(error => this.handleError('Refresh token', error))
    );
  }

  /**
   * Obtiene los scopes del usuario o doctor autenticado.
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

    let errorMessage = 'Ocurrió un error inesperado';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'status' in error) {
      const httpError = error as { status: number; error?: { detail?: string } };
      switch (httpError.status) {
        case 400:
          errorMessage = httpError.error?.detail ?? 'Datos de solicitud inválidos';
          break;
        case 401:
        case 404:
          errorMessage = httpError.error?.detail ?? 'Credenciales inválidas';
          this.storage.clearStorage();
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