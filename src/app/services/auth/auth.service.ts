import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, from } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { AUTH_ENDPOINTS } from './auth-endpoints';
import {
  TokenUserResponse,
  ScopesResponse,
  UserRead, DecodeResponse
} from '../interfaces/user.interfaces';
import { Auth } from '../interfaces/hospital.interfaces';
import { TokenDoctorsResponse } from '../interfaces/doctor.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly apiService: ApiService,
    private readonly storage: StorageService
  ) {}
  private readonly logger = inject(LoggerService);

  /**
   * Verifica si el usuario o doctor está autenticado.
   * @returns true si hay un token válido, false en caso contrario.
   */
  isLoggedIn(): boolean {
    return !!this.storage.getAccessToken();
  }

  /**
   * Inicia sesión con las credenciales de un usuario.
   * @param credentials Credenciales del usuario (email, password).
   * @returns Observable con la respuesta de autenticación (tokens).
   */
  login(credentials: Auth): Observable<TokenUserResponse> {
    return this.apiService
      .post<TokenUserResponse>(AUTH_ENDPOINTS.LOGIN, credentials)
      .pipe(
        tap((response) => {
          this.storage.setAccessToken(response.access_token);
          this.storage.setRefreshToken(response.refresh_token);
        }),
        catchError((error) => this.handleError('User Login', error))
      );
  }

  /**
   * Inicia el flujo de OAuth redirigiendo al endpoint de autorización.
   * @param service Nombre del servicio (ej. 'google').
   */
  oauthLogin(service: string): void {
    const url = `http://127.0.0.1:8000${AUTH_ENDPOINTS.OAUTH_LOGIN(service)}`;
    this.logger.debug(`Redirigiendo a OAuth para ${service}: ${url}`);
    window.location.href = url;
  }

  /**
   * Intercambia el código de autorización por un access_token.
   * @param code Código de autorización recibido en el callback.
   * @returns Observable con la respuesta de autenticación (tokens).
   */
  exchangeCodeForToken(code: string): Observable<TokenUserResponse> {
    const url = 'http://127.0.0.1:8000/api/oauth/google';
    this.logger.debug(`Intercambiando código en: ${url}`);
    return this.apiService.post<TokenUserResponse>(url, { code }).pipe(
      tap((response) => {
        this.logger.debug('Token recibido:', response.access_token);
        this.storage.setAccessToken(response.access_token);
        if (response.refresh_token) {
          this.storage.setRefreshToken(response.refresh_token);
        }
      }),
      catchError((error) => this.handleError('OAuth Code Exchange', error))
    );
  }

  /**
   * Decodifica el código secreto para obtener el access_token.
   * @param code Código secreto recibido en el query param 'a'.
   * @returns Observable con la respuesta de autenticación (access_token).
   */
  decode(code: string): Observable<DecodeResponse> {
    this.logger.debug('Decodificando código secreto');
    return this.apiService.post<DecodeResponse>(AUTH_ENDPOINTS.DECODE, { code }).pipe(
      tap((response) => {
        this.logger.debug('Access token recibido:', response.access_token);
        this.storage.setAccessToken(response.access_token);
      }),
      catchError((error) => this.handleError('Decode Code', error))
    );
  }

  /**
   * Almacena el access_token recibido en la URL.
   * @param accessToken Token de acceso recibido.
   * @returns Observable que completa si el token se almacena correctamente.
   */
  storeAccessToken(accessToken: string): Observable<void> {
    this.logger.debug('Almacenando access_token:', accessToken);
    this.storage.setAccessToken(accessToken);
    const storedToken = this.storage.getAccessToken();
    if (!storedToken) {
      this.logger.error('No se pudo almacenar el access_token');
      return throwError(() => new Error('No se pudo almacenar el access_token'));
    }
    this.logger.debug('Token almacenado correctamente:', storedToken);
    return of(undefined);
  }

  /**
   * Inicia sesión con las credenciales de un doctor.
   * @param credentials Credenciales del doctor (email, password).
   * @returns Observable con la respuesta de autenticación (tokens y datos del doctor).
   */
  doctorLogin(credentials: Auth): Observable<TokenDoctorsResponse> {
    return this.apiService
      .post<TokenDoctorsResponse>(AUTH_ENDPOINTS.DOC_LOGIN, credentials)
      .pipe(
        tap((response) => {
          this.storage.setAccessToken(response.access_token);
          this.storage.setRefreshToken(response.refresh_token);
        }),
        catchError((error) => this.handleError('Doctor Login', error))
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
      map((response) => response?.user ?? null),
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
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      this.storage.clearStorage();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService.get<TokenUserResponse>(AUTH_ENDPOINTS.REFRESH).pipe(
      tap((response) => {
        this.storage.setAccessToken(response.access_token);
        this.storage.setRefreshToken(response.refresh_token);
      }),
      catchError((error) => this.handleError('Refresh token', error))
    );
  }

  /**
   * Obtiene los scopes del usuario o doctor autenticado.
   * @returns Observable con la lista de scopes.
   */
  getScopes(): Observable<string[]> {
    return this.apiService.get<ScopesResponse>(AUTH_ENDPOINTS.SCOPES).pipe(
      map((response) => response.scopes),
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