import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { SPECIALITY_ENDPOINTS } from './speciality-endpoints';
import {
  Specialty,
  SpecialtyCreate,
  SpecialtyUpdate,
  SpecialtyDelete,
} from '../interfaces/hospital.interfaces';

/**
 * Service to manage speciality-related operations, interacting with the backend API.
 */
@Injectable({
  providedIn: 'root',
})
export class SpecialityService {
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  /**
   * Retrieves the list of all specialities, including associated doctors and services.
   * @returns Observable of an array of Specialty objects.
   */
  getSpecialities(): Observable<Specialty[]> {
    return this.apiService.get<Specialty[]>(SPECIALITY_ENDPOINTS.GET_ALL).pipe(
      map((response) => response || []),
      catchError((error) => this.handleError('Failed to fetch specialities', error))
    );
  }

  /**
   * Creates a new speciality (superuser only).
   * @param speciality The speciality data to create.
   * @returns Observable of the created Specialty object.
   */
  addSpeciality(speciality: SpecialtyCreate): Observable<Specialty> {
    return this.apiService.post<Specialty>(SPECIALITY_ENDPOINTS.ADD, speciality).pipe(
      catchError((error) => this.handleError('Failed to create speciality', error))
    );
  }

  /**
   * Deletes a speciality by ID (superuser only).
   * @param specialityId The ID of the speciality to delete.
   * @returns Observable of the SpecialtyDelete response.
   */
  deleteSpeciality(specialityId: number): Observable<SpecialtyDelete> {
    return this.apiService.delete<SpecialtyDelete>(SPECIALITY_ENDPOINTS.DELETE(specialityId)).pipe(
      catchError((error) => this.handleError(`Failed to delete speciality ${specialityId}`, error))
    );
  }

  /**
   * Updates a speciality by ID (superuser only).
   * @param specialityId The ID of the speciality to update.
   * @param speciality The updated speciality data.
   * @returns Observable of the updated Specialty object.
   */
  updateSpeciality(specialityId: number, speciality: SpecialtyUpdate): Observable<Specialty> {
    return this.apiService.put<Specialty>(
      SPECIALITY_ENDPOINTS.UPDATE(specialityId),
      speciality
    ).pipe(
      catchError((error) => this.handleError(`Failed to update speciality ${specialityId}`, error))
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

    let errorMessage = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'status' in error) {
      const httpError = error as { status: number; error?: { detail?: string } };
      switch (httpError.status) {
        case 400:
          errorMessage = httpError.error?.detail ?? 'Solicitud inválida. Verifica los datos enviados.';
          break;
        case 401:
          errorMessage = httpError.error?.detail ?? 'No autorizado. Sesión expirada.';
          this.storage.clearStorage();
          break;
        case 403:
          errorMessage = httpError.error?.detail ?? 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = httpError.error?.detail ?? 'Recurso no encontrado.';
          break;
        default:
          errorMessage = httpError.error?.detail ?? 'Error interno del servidor. Contacta al soporte.';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}