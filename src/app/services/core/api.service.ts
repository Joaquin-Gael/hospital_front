import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

/**
 * Service to handle HTTP requests to the backend API, encapsulating URL construction
 * with a dynamic UUID prefix.
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000';
  private uuidSubject = new BehaviorSubject<string | null>(null);
  private uuid$ = this.uuidSubject.asObservable();

  constructor(private http: HttpClient) {
    this.fetchUuid();
  }

  /**
   * Fetches the UUID prefix from the backend and updates the BehaviorSubject.
   */
  private fetchUuid(): void {
    this.http
      .get<{ id_prefix_api_secret: string }>(`${this.baseUrl}/id_prefix_api_secret/`)
      .subscribe({
        next: (response) => {
          this.uuidSubject.next(response.id_prefix_api_secret);
          console.log('UUID fetched:', response.id_prefix_api_secret);
        },
        error: (err) => {
          console.error('Error fetching UUID:', err);
          this.uuidSubject.next(null);
        },
      });
  }

  /**
   * Builds the full URL for an endpoint, including the UUID prefix.
   * @param endpoint The API endpoint (e.g., '/doctors/').
   * @returns Observable of the constructed URL.
   */
  private buildUrl(endpoint: string): Observable<string> {
    return this.uuid$.pipe(
      switchMap((uuid) => {
        if (!uuid) {
          return throwError(() => new Error('UUID not available'));
        }
        return new Observable<string>((observer) => {
          observer.next(`${this.baseUrl}/${uuid}/${endpoint}`);
          observer.complete();
        });
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
      })
    );
  }
}