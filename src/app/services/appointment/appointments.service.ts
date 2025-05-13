import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { APPOINTMENT_ENDPOINTS } from './appointment-endpoints';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { Appointment, Turn, TurnCreate, TurnDelete } from '../interfaces/appointment.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  constructor(
    private readonly apiService: ApiService,
    private readonly logger: LoggerService,
    private readonly storage: StorageService
  ) {}

  /**
   * Obtiene la lista de citas (solo superusers).
   * @param userId ID del usuario para filtrar citas.
   * @returns Observable con la lista de citas.
   */
  getAppointments(userId: number): Observable<Appointment[]> {
    const endpoint = `${APPOINTMENT_ENDPOINTS.GET_APPOINTMENTS}?user_id=${userId}`;
    return this.apiService.get<Appointment[]>(endpoint).pipe(
      map((response) => response || []),
      catchError((error) => this.handleError('Error fetching appointments', error))
    );
  }

  /**
   * Crea un nuevo turno (y cita asociada).
   * @param turn Datos del turno a crear.
   * @returns Observable con el turno creado.
   */
  createTurn(turn: TurnCreate): Observable<Turn> {
    return this.apiService.post<Turn>(APPOINTMENT_ENDPOINTS.CREATE_TURN, turn).pipe(
      catchError((error) => this.handleError('Error creating turn', error))
    );
  }

  /**
   * Elimina un turno existente.
   * @param turnId ID del turno a eliminar.
   * @returns Observable con la respuesta de eliminación.
   */
  deleteTurn(turnId: number): Observable<TurnDelete> {
    return this.apiService.delete<TurnDelete>(APPOINTMENT_ENDPOINTS.DELETE_TURN(turnId)).pipe(
      catchError((error) => this.handleError(`Error deleting turn ${turnId}`, error))
    );
  }

  /**
   * Maneja errores de las peticiones HTTP.
   * @param message Mensaje descriptivo del error.
   * @param error Objeto de error.
   * @returns Observable con el error transformado.
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