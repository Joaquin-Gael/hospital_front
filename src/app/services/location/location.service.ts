import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { LOCATION_ENDPOINTS } from './location-endpoints';
import { Location, LocationCreate, LocationUpdate, LocationDelete } from '../interfaces/hospital.interfaces';

/**
 * Service to manage location-related operations, interacting with the backend API.
 */
@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  /**
   * Retrieves the list of all locations, including associated departments.
   * @returns Observable of an array of Location objects.
   */
  getLocations(): Observable<Location[]> {
    return this.apiService.get<{ locations: Location[] }>(LOCATION_ENDPOINTS.GET_ALL).pipe(
      map((response) => {
        console.log('Respuesta del endpoint /medic/locations:', response);
        return response?.locations || []; // Extraer el array de locations o devolver un array vacío si no existe
      }),
      catchError((error) => this.handleError('Failed to fetch locations', error))
    );
  }

  /**
   * Creates a new location (superuser only).
   * @param location The location data to create.
   * @returns Observable of the created Location object.
   */
  addLocation(location: LocationCreate): Observable<Location> {
    return this.apiService.post<Location>(LOCATION_ENDPOINTS.ADD, location).pipe(
      catchError((error) => this.handleError('Failed to create location', error))
    );
  }

  /**
   * Deletes a location by ID (superuser only).
   * @param locationId The ID of the location to delete.
   * @returns Observable of the LocationDelete response.
   */
  deleteLocation(locationId: string): Observable<LocationDelete> {
    return this.apiService.delete<LocationDelete>(LOCATION_ENDPOINTS.DELETE(locationId)).pipe(
      catchError((error) => this.handleError(`Failed to delete location ${locationId}`, error))
    );
  }

  /**
   * Updates a location by ID (superuser only).
   * @param locationId The ID of the location to update.
   * @param location The updated location data.
   * @returns Observable of the updated Location object.
   */
  updateLocation(locationId: string, location: LocationUpdate): Observable<Location> {
    return this.apiService.put<Location>(LOCATION_ENDPOINTS.UPDATE(locationId), location).pipe(
      catchError((error) => this.handleError(`Failed to update location ${locationId}`, error))
    );
  }

  /**
   * Handles HTTP errors, logging them and returning user-friendly messages.
   * Clears storage on 401 Unauthorized errors.
   * @param message The error message.
   * @param error The HTTP error response.
   * @returns Observable with a formatted error message.
   */
  private handleError(message: string, error: unknown): Observable<never> {
    this.logger.error(message, error);

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