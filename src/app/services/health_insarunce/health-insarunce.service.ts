import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import {
  HealthInsuranceRead,
  HealthInsuranceCreate,
  HealthInsuranceUpdate,
} from '../interfaces/health-insurance.interfaces';
import { HEALTH_INSURANCE_ENDPOINTS } from './health-insurance-endpoints';

/**
 * Servicio que maneja todas las operaciones relacionadas con obras sociales.
 * Se comunica con el backend (FastAPI) usando ApiService como intermediario.
 */
@Injectable({
  providedIn: 'root',
})
export class HealthInsuranceService {
  constructor(
    private apiService: ApiService,
    private logger: LoggerService
  ) {}

  /**
   * Trae todas las obras sociales registradas.
   * Ideal para mostrar en listados o combos.
   */
  getAll(): Observable<HealthInsuranceRead[]> {
    return this.apiService.get<HealthInsuranceRead[]>(HEALTH_INSURANCE_ENDPOINTS.getAll).pipe(
      tap(() => this.logger.info('Obras sociales obtenidas correctamente')),
      catchError((err) => {
        this.logger.error('Error al obtener obras sociales', err);
        return throwError(() => new Error('No se pudieron cargar las obras sociales'));
      })
    );
  }

  /**
   * Trae los datos de una obra social específica.
   * @param id UUID de la obra social.
   */
  getById(id: string): Observable<HealthInsuranceRead> {
    return this.apiService.get<HealthInsuranceRead>(HEALTH_INSURANCE_ENDPOINTS.getById(id)).pipe(
      tap(() => this.logger.info(`Obra social con ID ${id} obtenida correctamente`)),
      catchError((err) => {
        this.logger.error(`Error al obtener la obra social con ID ${id}`, err);
        return throwError(() => new Error(`No se pudo obtener la obra social con ID ${id}`));
      })
    );
  }

  /**
   * Crea una nueva obra social.
   * @param data Datos requeridos para el registro.
   */
  create(data: HealthInsuranceCreate): Observable<HealthInsuranceRead> {
    return this.apiService.post<HealthInsuranceRead>(HEALTH_INSURANCE_ENDPOINTS.create, data).pipe(
      tap(() => this.logger.info('Obra social creada correctamente')),
      catchError((err) => {
        this.logger.error('Error al crear la obra social', err);
        return throwError(() => new Error('No se pudo crear la obra social'));
      })
    );
  }

  /**
   * Edita parcialmente una obra social existente.
   * @param id UUID de la obra social a editar.
   * @param data Campos a modificar.
   */
  update(id: string, data: HealthInsuranceUpdate): Observable<HealthInsuranceRead> {
    return this.apiService.patch<HealthInsuranceRead>(HEALTH_INSURANCE_ENDPOINTS.update(id), data).pipe(
      tap(() => this.logger.info(`Obra social con ID ${id} actualizada correctamente`)),
      catchError((err) => {
        this.logger.error(`Error al actualizar la obra social con ID ${id}`, err);
        return throwError(() => new Error(`No se pudo actualizar la obra social con ID ${id}`));
      })
    );
  }

  /**
   * Elimina una obra social del sistema.
   * @param id UUID de la obra social a eliminar.
   */
  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(HEALTH_INSURANCE_ENDPOINTS.delete(id)).pipe(
      tap(() => this.logger.info(`Obra social con ID ${id} eliminada correctamente`)),
      catchError((err) => {
        this.logger.error(`Error al eliminar la obra social con ID ${id}`, err);
        return throwError(() => new Error(`No se pudo eliminar la obra social con ID ${id}`));
      })
    );
  }
}
