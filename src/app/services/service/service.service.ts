import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { SERVICE_ENDPOINTS } from './service-endpoints';
import { Service, ServiceCreate, ServiceUpdate, ServiceDelete } from '../interfaces/hospital.interfaces';

/**
 * Service to manage service-related operations, interacting with the backend API.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  /**
   * Retrieves the list of all services.
   * @returns Observable of an array of Service objects.
   */
  getServices(): Observable<Service[]> {
    return this.apiService.get<Service[]>(SERVICE_ENDPOINTS.GET_ALL).pipe(
      map((response) => response || []),
      catchError((error) => this.handleError('Failed to fetch services', error))
    );
  }

  /**
   * Creates a new service.
   * @param service The service data to create.
   * @returns Observable of the created Service object.
   */
  createService(service: ServiceCreate): Observable<Service> {
    return this.apiService.post<Service>(SERVICE_ENDPOINTS.CREATE, service).pipe(
      catchError((error) => this.handleError('Failed to create service', error))
    );
  }

  /**
   * Updates a service by its ID.
   * @param serviceId The ID of the service to update.
   * @param service The updated service data.
   * @returns Observable of the updated Service object.
   */
  updateService(serviceId: string, service: ServiceUpdate): Observable<Service> {
    return this.apiService.put<Service>(SERVICE_ENDPOINTS.UPDATE(serviceId), service).pipe(
      catchError((error) => this.handleError(`Failed to update service ${serviceId}`, error))
    );
  }

  /**
   * Deletes a service by its ID.
   * @param serviceId The ID of the service to delete.
   * @returns Observable of a ServiceDelete object with deletion confirmation.
   */
  deleteService(serviceId: string): Observable<ServiceDelete> {
    return this.apiService.delete<ServiceDelete>(SERVICE_ENDPOINTS.DELETE(serviceId)).pipe(
      catchError((error) => this.handleError(`Failed to delete service ${serviceId}`, error))
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