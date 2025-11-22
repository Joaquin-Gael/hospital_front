import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { SCHEDULE_ENDPOINTS } from './schedule-endpoints';
import {
  MedicalScheduleCreate,
  MedicalScheduleUpdate,
  MedicalScheduleDelete,
  MedicalScheduleDaysResponse,
  MedicalScheduleDaysRequest,
} from '../interfaces/hospital.interfaces';
import { MedicalSchedule } from '../../services/interfaces/doctor.interfaces';

/**
 * Service to manage medical schedule-related operations, interacting with the backend API.
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  /**
   * Retrieves the list of all medical schedules, including associated doctors.
   * @returns Observable of an array of MedicalSchedule objects.
   */
  getSchedules(): Observable<MedicalSchedule[]> {
    return this.apiService
      .get<MedicalSchedule[]>(SCHEDULE_ENDPOINTS.GET_ALL)
      .pipe(
        map((response) => response || []),
        catchError((error) =>
          this.handleError('Failed to fetch schedules', error)
        )
      );
  }

  /**
   * Creates a new medical schedule (superuser only).
   * @param schedule The schedule data to create.
   * @returns Observable of the created MedicalSchedule object.
   */
  addSchedule(schedule: MedicalScheduleCreate): Observable<MedicalSchedule> {
    return this.apiService
      .post<MedicalSchedule>(SCHEDULE_ENDPOINTS.ADD, schedule)
      .pipe(
        catchError((error) =>
          this.handleError('Failed to create schedule', error)
        )
      );
  }

  getAvailableDays(
    request: MedicalScheduleDaysRequest | string
  ): Observable<MedicalScheduleDaysResponse> {
    const { specialtyId, date } =
      typeof request === 'string'
        ? { specialtyId: request, date: undefined }
        : request;

    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }

    return this.apiService
      .get<MedicalScheduleDaysResponse>(
        SCHEDULE_ENDPOINTS.GET_DAYS({ specialtyId, date }),
        date ? { params } : undefined
      )
      .pipe(
        map((response) => {
          if (!response || !Array.isArray(response.available_days)) {
            return { available_days: [] };
          }
          const validDays = response.available_days.filter(
            (day) =>
              typeof day.day === 'string' &&
              typeof day.start_time === 'string' &&
              typeof day.end_time === 'string' &&
              /^[a-zA-Z]+$/.test(day.day) && 
              /^\d{2}:\d{2}:\d{2}$/.test(day.start_time) && 
              /^\d{2}:\d{2}:\d{2}$/.test(day.end_time)
          );
          return { available_days: validDays };
        }),
        catchError((error) =>
          this.handleError(
            `Failed to fetch available days for specialty ${specialtyId}`,
            error
          )
        )
      );
  }

  /**
   * Deletes a medical schedule by ID (superuser only).
   * @param scheduleId The ID of the schedule to delete.
   * @returns Observable of the MedicalScheduleDelete response.
   */
  deleteSchedule(scheduleId: string): Observable<MedicalScheduleDelete> {
    return this.apiService
      .delete<MedicalScheduleDelete>(SCHEDULE_ENDPOINTS.DELETE(scheduleId))
      .pipe(
        catchError((error) =>
          this.handleError(`Failed to delete schedule ${scheduleId}`, error)
        )
      );
  }

  /**
   * Associates a doctor to a medical schedule (superuser only).
   * @param doctorId The ID of the doctor.
   * @param scheduleId The ID of the schedule.
   * @returns Observable of the updated MedicalSchedule object.
   */
  addDoctorToSchedule(
    doctorId: string,
    scheduleId: string
  ): Observable<MedicalSchedule> {
    const params = new HttpParams()
      .set('doc_id', doctorId)
      .set('schedule_id', scheduleId);
    return this.apiService
      .put<MedicalSchedule>(SCHEDULE_ENDPOINTS.ADD_DOCTOR, {}, { params })
      .pipe(
        catchError((error) =>
          this.handleError(
            `Failed to add doctor ${doctorId} to schedule ${scheduleId}`,
            error
          )
        )
      );
  }

  /**
   * Updates a medical schedule by ID (superuser only).
   * @param schedule The updated schedule data.
   * @returns Observable of the updated MedicalSchedule object.
   */
  updateSchedule(schedule: MedicalScheduleUpdate): Observable<MedicalSchedule> {
    return this.apiService
      .put<MedicalSchedule>(SCHEDULE_ENDPOINTS.UPDATE, schedule)
      .pipe(
        catchError((error) =>
          this.handleError(`Failed to update schedule ${schedule.id}`, error)
        )
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
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error
    ) {
      const httpError = error as {
        status: number;
        error?: { detail?: string };
      };
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
          if (message.toLowerCase().includes('available days')) {
            errorMessage = 'Especialidad no encontrada';
          } else {
            errorMessage = httpError.error?.detail ?? 'Resource not found';
          }
          break;
        default:
          errorMessage = httpError.error?.detail ?? 'Server error';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
