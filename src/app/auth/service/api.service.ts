import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

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

  // GET
  get<T>(endpoint: string): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.get<T>(url)),
      catchError((err) => {
        console.error(`Error in GET ${endpoint}:`, err);
        return throwError(() => err);
      })
    );
  }

  // POST
  post<T>(endpoint: string, payload: any): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.post<T>(url, payload)),
      catchError((err) => {
        console.error(`Error in POST ${endpoint}:`, err);
        return throwError(() => err);
      })
    );
  }

  // PUT
  put<T>(endpoint: string, payload: any): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.put<T>(url, payload)),
      catchError((err) => {
        console.error(`Error in PUT ${endpoint}:`, err);
        return throwError(() => err);
      })
    );
  }

  // DELETE
  delete<T>(endpoint: string): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.delete<T>(url)),
      catchError((err) => {
        console.error(`Error in DELETE ${endpoint}:`, err);
        return throwError(() => err);
      })
    );
  }

  // PATCH
  patch<T>(endpoint: string, payload: any): Observable<T> {
    return this.buildUrl(endpoint).pipe(
      switchMap((url) => this.http.patch<T>(url, payload)),
      catchError((err) => {
        console.error(`Error in PATCH ${endpoint}:`, err);
        return throwError(() => err);
      })
    );
  }
}