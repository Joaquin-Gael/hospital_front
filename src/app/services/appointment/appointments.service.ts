import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { APPOINTMENT_ENDPOINTS } from './appointment-endpoints';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { Appointment, Turn, TurnCreate, TurnDelete, UpdateTurnState } from '../interfaces/appointment.interfaces';
import { PayTurnWithCashResponse } from '../interfaces/cashes.interfaces';

@Injectable({
  providedIn: 'root'
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
   * Obtiene la lista de turnos.
   * @returns Observable con la lista de turnos.
   */
  getTurns(): Observable<Turn[]> {
    this.logger.debug('Obteniendo lista de turnos');
    return this.apiService.get<Turn[]>(APPOINTMENT_ENDPOINTS.GET_TURNS).pipe(
      map((response) => response || []),
      catchError((error) => this.handleError('Error fetching turns', error))
    );
  }

  /**
   * Obtiene los turnos de un usuario específico.
   * @param userId ID del usuario.
   * @returns Observable con la lista de turnos del usuario.
   */
  getTurnsByUserId(userId: string): Observable<Turn[]> {
    this.logger.debug(`Obteniendo turnos para el usuario: ${userId}`);
    return this.apiService.get<Turn[]>(APPOINTMENT_ENDPOINTS.GET_BY_ID(userId)).pipe(
      map((response) => response || []),
      catchError((error) => this.handleError(`Error fetching turns for user ${userId}`, error))
    );
  }
   
  /**
   * Obtiene un turno específico por su ID.
   * @param turnId ID del turno.
   * @returns Observable con los datos del turno.
   */
  getTurnById(turnId: string): Observable<Turn> {
    this.logger.debug(`Obteniendo turno con ID: ${turnId}`);
    return this.apiService.get<Turn>(APPOINTMENT_ENDPOINTS.GET_TURN(turnId)).pipe(
      catchError((error) => this.handleError(`Error fetching turn ${turnId}`, error))
    );
  }

  /**
   * Crea un nuevo turno.
   * @param turnData Datos del turno a crear.
   * @returns Observable con los datos del turno creado y la URL de pago.
   */
  createTurn(turnData: TurnCreate): Observable<PayTurnWithCashResponse> {
    this.logger.debug('Creando nuevo turno', turnData);
    return this.apiService.post<PayTurnWithCashResponse>(APPOINTMENT_ENDPOINTS.CREATE_TURN, turnData).pipe(
      catchError((error) => this.handleError('Error creating turn', error))
    );
  }

  updateTurnState(turnId: string, newState: string): Observable<UpdateTurnState> {
    const endpoint = `${APPOINTMENT_ENDPOINTS.UPDATE_TURN_STATE()}?turn_id=${encodeURIComponent(turnId)}&new_state=${encodeURIComponent(newState)}`;
    this.logger.debug(`Updating turn state for turn ${turnId} with newState: ${newState} at ${endpoint}`);
    return this.apiService.patch<UpdateTurnState>(endpoint, null).pipe(
      catchError((error) => this.handleError(`Error updating turn state for turn ${turnId}`, error))
    );
  }

  /**
   * Elimina un turno específico.
   * @param turnId ID del turno a eliminar.
   * @returns Observable que completa al eliminar el turno.
   */
  deleteTurn(turnId: string): Observable<TurnDelete> {
    this.logger.debug(`Eliminando turno con ID: ${turnId}`);
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
        case 405:
          errorMessage = httpError.error?.detail ?? 'Method not allowed';
          break;
        default:
          errorMessage = httpError.error?.detail ?? 'Server error';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}