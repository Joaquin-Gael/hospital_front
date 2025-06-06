import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, switchMap, tap, shareReplay, map } from 'rxjs/operators';

/**
 * Service to handle HTTP requests to the backend API, encapsulating URL construction
 * with a dynamic UUID prefix.
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000';
  private baseWsUrl = 'ws://127.0.0.1:8000'; 
  private uuidSubject = new ReplaySubject<string>(1);
  private uuid$ = this.uuidSubject.asObservable();
  private uuidLoaded$!: Observable<string>;

  constructor(private http: HttpClient) {
    this.fetchUuid();
  }

  /**
   * Fetches the UUID prefix from the backend and updates the ReplaySubject.
   * Caches the result to avoid multiple requests.
   */
  private fetchUuid(): void {
    this.uuidLoaded$ = this.http
      .get<{ id_prefix_api_secret: string }>(`${this.baseUrl}/id_prefix_api_secret/`)
      .pipe(
        tap((response) => {
          console.log('UUID fetched:', response.id_prefix_api_secret);
          this.uuidSubject.next(response.id_prefix_api_secret);
        }),
        map((response) => response.id_prefix_api_secret),
        catchError((err) => {
          console.error('Error fetching UUID:', err);
          return throwError(() => new Error('No se pudo cargar el UUID de la API'));
        }),
        shareReplay(1)
      );

    // Subscribe to ensure the UUID is fetched immediately
    this.uuidLoaded$.subscribe({
      error: (err) => console.error('UUID loading failed:', err),
    });
  }

  /**
   * Builds the full URL for an endpoint, including the UUID prefix.
   * @param endpoint The API endpoint (e.g., 'doctors/').
   * @returns Observable of the constructed URL.
   */
  private buildUrl(endpoint: string): Observable<string> {
    return this.uuidLoaded$.pipe(
      map((uuid) => {
        // Remove leading/trailing slashes to avoid malformed URLs
        const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
        return `${this.baseUrl}/${uuid}/${cleanEndpoint}`;
      }),
      catchError((err) => {
        console.error('Error building URL:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Builds the full URL for a WebSocket endpoint, including the UUID prefix.
   * @param endpoint The WebSocket endpoint (e.g., 'medic/chat/ws/chat/<chatId>').
   * @returns Observable of the constructed WebSocket URL.
   */
  public buildWsUrl(endpoint: string): Observable<string> {
    return this.uuidLoaded$.pipe(
      map((uuid) => {
        const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
        return `${this.baseWsUrl}/${uuid}/${cleanEndpoint}`;
      }),
      catchError((err) => {
        console.error('Error building WebSocket URL:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Performs a GET request to the specified endpoint.
   * @param endpoint The API endpoint.
   * @param options Optional HTTP options (e.g., query parameters).
   * @returns Observable of the response data.
   */
  get<T>(endpoint: string, options?: { params?: HttpParams }): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.get<T>(url, options)),
      catchError((err) => {
        console.error(`Error in GET ${endpoint}:`, err);
        return throwError(() => new Error(`Error al obtener datos de ${endpoint}`));
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
  post<T>(endpoint: string, payload: any, options?: { params?: HttpParams }): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.post<T>(url, payload, options)),
      catchError((err) => {
        console.error(`Error in POST ${endpoint}:`, err);
        return throwError(() => new Error(`Error al enviar datos a ${endpoint}`));
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
        console.error(`Error in PUT ${endpoint}:`, err);
        return throwError(() => new Error(`Error al actualizar datos en ${endpoint}`));
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
        console.error(`Error in DELETE ${endpoint}:`, err);
        return throwError(() => new Error(`Error al eliminar datos en ${endpoint}`));
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
  patch<T>(endpoint: string, payload: any, options?: { params?: HttpParams }): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.patch<T>(url, payload, options)),
      catchError((err) => {
        console.error(`Error in PATCH ${endpoint}:`, err);
        return throwError(() => new Error(`Error al modificar datos en ${endpoint}`));
      })
    );
  }
}