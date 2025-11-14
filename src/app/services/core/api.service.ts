import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, defer, firstValueFrom, throwError, of } from 'rxjs';
import { catchError, switchMap, tap, shareReplay, map } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { API_BASE_URL, API_WS_BASE_URL } from './api.tokens';

/**
 * Service to handle HTTP requests to the backend API, encapsulating URL construction
 * with a dynamic UUID prefix.
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly baseWsUrl = inject(API_WS_BASE_URL);
  private readonly logger = inject(LoggerService);
  private readonly uuid$ = this.createUuidStream();

  /**
   * Exposes the cached UUID as a promise for consumers that require a one-time value.
   */
  getUuid(): Promise<string> {
    return firstValueFrom(this.uuid$);
  }

  /**
   * Creates a cold observable that retrieves and caches the UUID prefix from the backend.
   */
  private createUuidStream(): Observable<string> {
    return defer(() =>
      this.http.get<{ id_prefix_api_secret: string }>(`${this.baseUrl}/id_prefix_api_secret/`)
    ).pipe(
      tap((response) => {
        this.logger.debug('UUID fetched', response.id_prefix_api_secret);
      }),
      map((response) => response.id_prefix_api_secret),
      catchError((err) => {
        const errorResponse = this.toHttpErrorResponse(err, 'No se pudo cargar el UUID de la API');
        this.logger.error('Error fetching UUID', errorResponse);
        return throwError(() => errorResponse);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  /**
   * Builds the full URL for an endpoint, including the UUID prefix.
   * @param endpoint The API endpoint (e.g., 'doctors/').
   * @returns Observable of the constructed URL.
   */
  private buildUrl(endpoint: string): Observable<string> {
    if (/^https?:\/\//i.test(endpoint)) {
      return of(endpoint);
    }

    return this.uuid$.pipe(
      map((uuid) => {
        // Remove leading/trailing slashes to avoid malformed URLs
        const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
        return `${this.baseUrl}/${uuid}/${cleanEndpoint}`;
      }),
      catchError((err) => {
        const errorResponse = this.toHttpErrorResponse(err, `Error al construir la URL para ${endpoint}`);
        this.logger.error('Error building URL', errorResponse);
        return throwError(() => errorResponse);
      })
    );
  }

  /**
   * Builds the full URL for a WebSocket endpoint, including the UUID prefix.
   * @param endpoint The WebSocket endpoint (e.g., 'medic/chat/ws/chat/<chatId>').
   * @returns Observable of the constructed WebSocket URL.
   */
  public buildWsUrl(endpoint: string): Observable<string> {
    return this.uuid$.pipe(
      map((uuid) => {
        const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
        return `${this.baseWsUrl}/${uuid}/${cleanEndpoint}`;
      }),
      catchError((err) => {
        const errorResponse = this.toHttpErrorResponse(err, `Error al construir la URL de WebSocket para ${endpoint}`);
        this.logger.error('Error building WebSocket URL', errorResponse);
        return throwError(() => errorResponse);
      })
    );
  }

  /**
   * Performs a GET request to the specified endpoint.
   * @param endpoint The API endpoint.
   * @param options Optional HTTP options (e.g., query parameters).
   * @returns Observable of the response data.
   */
  get<T>(endpoint: string, options?: { headers?: HttpHeaders | { [header: string]: string | string[] }, params?: HttpParams }): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.get<T>(url, options)),
      catchError((err) => {
        const errorResponse = this.toHttpErrorResponse(err, `Error al obtener datos de ${endpoint}`);
        this.logger.error(`Error in GET ${endpoint}`, errorResponse);
        return throwError(() => errorResponse);
      })
    );
  }

  /**
   * Performs a POST request to the specified endpoint.
   * @param endpoint The API endpoint.
   * @param payload The request body.
   * @param options Optional HTTP options (e.g., query parameters).
   * @returns Observable of the response data.
   */
  post<T>(endpoint: string, payload: any, options?: { headers?: HttpHeaders | { [header: string]: string | string[] }, params?: HttpParams }): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.post<T>(url, payload, options)),
      catchError((err) => {
        const errorResponse = this.toHttpErrorResponse(err, `Error al enviar datos a ${endpoint}`);
        this.logger.error(`Error in POST ${endpoint}`, errorResponse);
        return throwError(() => errorResponse);
      })
    );
  }

  /**
   * Performs a PUT request to the specified endpoint.
   * @param endpoint The API endpoint.
   * @param payload The request body.
   * @param options Optional HTTP options (e.g., query parameters).
   * @returns Observable of the response data.
   */
  put<T>(endpoint: string, payload: any, options?: { params?: HttpParams }): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.put<T>(url, payload, options)),
      catchError((err) => {
        const errorResponse = this.toHttpErrorResponse(err, `Error al actualizar datos en ${endpoint}`);
        this.logger.error(`Error in PUT ${endpoint}`, errorResponse);
        return throwError(() => errorResponse);
      })
    );
  }

  /**
   * Performs a DELETE request to the specified endpoint.
   * @param endpoint The API endpoint.
   * @param options Optional HTTP options (e.g., query parameters).
   * @returns Observable of the response data.
   */
  delete<T>(endpoint: string, options?: { params?: HttpParams }): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.delete<T>(url, options)),
      catchError((err) => {
        const errorResponse = this.toHttpErrorResponse(err, `Error al eliminar datos en ${endpoint}`);
        this.logger.error(`Error in DELETE ${endpoint}`, errorResponse);
        return throwError(() => errorResponse);
      })
    );
  }

  /**
   * Performs a PATCH request to the specified endpoint.
   * @param endpoint The API endpoint.
   * @param payload The request body.
   * @param options Optional HTTP options (e.g., query parameters).
   * @returns Observable of the response data.
   */
  patch<T>(endpoint: string, payload: any, options?: { headers?: HttpHeaders | { [header: string]: string | string[] }, params?: HttpParams }): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.patch<T>(url, payload, options)),
      catchError((err) => {
        const errorResponse = this.toHttpErrorResponse(err, `Error al modificar datos en ${endpoint}`);
        this.logger.error(`Error in PATCH ${endpoint}`, errorResponse);
        return throwError(() => errorResponse);
      })
    );
  }

  private toHttpErrorResponse(err: unknown, statusText: string): HttpErrorResponse {
    if (err instanceof HttpErrorResponse) {
      return err;
    }

    return new HttpErrorResponse({
      error: err,
      status: typeof err === 'object' && err !== null && 'status' in err ? (err as { status: number }).status : 0,
      statusText,
    });
  }
}