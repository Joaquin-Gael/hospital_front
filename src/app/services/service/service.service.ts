import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { SERVICE_ENDPOINTS } from './service-endpoints';
import { Service, ServiceCreate, ServiceUpdate, ServiceDelete } from '../interfaces/hospital.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  getServices(): Observable<Service[]> {
    return this.apiService.get<Service[]>(SERVICE_ENDPOINTS.GET_ALL).pipe(
      map((response) => response || []),
      catchError((error) => this.handleError('Failed to fetch services', error))
    );
  }

  createService(service: ServiceCreate): Observable<Service> {
    return this.apiService.post<Service>(SERVICE_ENDPOINTS.CREATE, service).pipe(
      map((response) => {return response;}),
      catchError((error) => this.handleError('Failed to create service', error))
    );
  }

  updateService(serviceId: string, service: ServiceUpdate): Observable<Service> {
    return this.apiService.patch<Service>(SERVICE_ENDPOINTS.UPDATE(serviceId), service).pipe(
      map((response) => {return response;}),
      catchError((error) => this.handleError(`Failed to update service ${serviceId}`, error))
    );
  }

  deleteService(serviceId: string): Observable<ServiceDelete> {
    return this.apiService.delete<ServiceDelete>(SERVICE_ENDPOINTS.DELETE(serviceId)).pipe(
      catchError((error) => this.handleError(`Failed to delete service ${serviceId}`, error))
    );
  }

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