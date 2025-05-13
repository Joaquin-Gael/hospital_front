import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { DOCTOR_ENDPOINTS } from './doctor-endpoints';
import { SCHEDULE_ENDPOINTS } from '../schedule/schedule-endpoints';
import {
  Doctor,
  DoctorCreate,
  DoctorUpdate,
  DoctorDelete,
  DoctorMeResponse,
  MedicalSchedule,
} from '../interfaces/doctor.interfaces';
import { ServiceService } from '../service/service.service';
import { Service } from '../interfaces/hospital.interfaces';

/**
 * Service to manage doctor-related operations, interacting with the backend API.
 * Encapsulates HTTP requests for fetching, creating, updating, and deleting doctors,
 * as well as managing schedules and ban status.
 */
@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);
  private readonly serviceService = inject(ServiceService);

  /**
   * Retrieves the list of all doctors.
   * @returns Observable of an array of Doctor objects.
   */
  getDoctors(): Observable<Doctor[]> {
    return this.apiService.get<Doctor[]>(DOCTOR_ENDPOINTS.GET_ALL).pipe(
      map((response) => response || []),
      catchError((error) => this.handleError(error, 'Failed to fetch doctors'))
    );
  }

  /**
   * Retrieves doctors by speciality ID.
   * @param specialityId The UUID of the speciality.
   * @returns Observable of an array of Doctor objects.
   */
  getDoctorsBySpeciality(specialityId: string): Observable<Doctor[]> {
    const params = new HttpParams().set('speciality_id', specialityId);
    return this.apiService.get<Doctor[]>(DOCTOR_ENDPOINTS.GET_ALL, { params }).pipe(
      map((response) => response || []),
      catchError((error) => this.handleError(error, `Failed to fetch doctors for speciality ${specialityId}`))
    );
  }

  /**
   * Retrieves available schedules for a service and optional date.
   * @param serviceId The ID of the service.
   * @param date Optional date to filter schedules (ISO format, e.g., '2025-05-15').
   * @returns Observable of an array of MedicalSchedule objects.
   */
  getAvailableSchedules(serviceId: number, date?: string): Observable<MedicalSchedule[]> {
    return this.serviceService.getServices().pipe(
      map((services) => {
        const service = services.find((s) => s.id === serviceId);
        if (!service) {
          throw new Error(`Service ${serviceId} not found`);
        }
        return service;
      }),
      switchMap((service: Service) =>
        this.apiService.get<MedicalSchedule[]>(SCHEDULE_ENDPOINTS.GET_ALL).pipe(
          map((schedules) =>
            schedules.filter((schedule) => {
              const hasMatchingDoctor = schedule.doctors?.some((doctorId) =>
                this.getDoctorsBySpeciality(service.specialty_id).pipe(
                  map((doctors) => doctors.some((doc) => doc.id === doctorId))
                )
              );
              const matchesDate = date ? schedule.day === this.getDayOfWeek(date) : true;
              return hasMatchingDoctor && matchesDate;
            })
          ),
          map((response) => response || []),
          catchError((error) => this.handleError(error, `Failed to fetch schedules for service ${serviceId}`))
        )
      )
    );
  }

  /**
   * Retrieves a doctor by their ID.
   * @param doctorId The UUID of the doctor.
   * @returns Observable of a Doctor object.
   */
  getDoctorById(doctorId: string): Observable<Doctor> {
    return this.apiService.get<Doctor>(DOCTOR_ENDPOINTS.GET_BY_ID(doctorId)).pipe(
      catchError((error) => this.handleError(error, `Failed to fetch doctor ${doctorId}`))
    );
  }

  /**
   * Retrieves the authenticated doctor's details and schedules.
   * @returns Observable of a DoctorMeResponse object containing the doctor and their schedules.
   */
  getMe(): Observable<DoctorMeResponse> {
    return this.apiService.get<DoctorMeResponse>(DOCTOR_ENDPOINTS.GET_ME).pipe(
      catchError((error) => this.handleError(error, 'Failed to fetch authenticated doctor'))
    );
  }

  /**
   * Creates a new doctor.
   * @param doctor The doctor data to create.
   * @returns Observable of the created Doctor object.
   */
  createDoctor(doctor: DoctorCreate): Observable<Doctor> {
    return this.apiService.post<Doctor>(DOCTOR_ENDPOINTS.CREATE, doctor).pipe(
      catchError((error) => this.handleError(error, 'Failed to create doctor'))
    );
  }

  /**
   * Deletes a doctor by their ID.
   * @param doctorId The UUID of the doctor to delete.
   * @returns Observable of a DoctorDelete object with deletion confirmation.
   */
  deleteDoctor(doctorId: string): Observable<DoctorDelete> {
    return this.apiService.delete<DoctorDelete>(DOCTOR_ENDPOINTS.DELETE(doctorId)).pipe(
      catchError((error) => this.handleError(error, `Failed to delete doctor ${doctorId}`))
    );
  }

  /**
   * Deletes a schedule from a doctor.
   * @param doctorId The UUID of the doctor.
   * @param scheduleId The UUID of the schedule to delete.
   * @returns Observable of the updated Doctor object.
   */
  deleteDoctorSchedule(doctorId: string, scheduleId: string): Observable<Doctor> {
    return this.apiService.delete<Doctor>(
      DOCTOR_ENDPOINTS.DELETE_SCHEDULE(doctorId, scheduleId)
    ).pipe(
      catchError((error) =>
        this.handleError(error, `Failed to delete schedule ${scheduleId} for doctor ${doctorId}`)
      )
    );
  }

  /**
   * Updates a doctor's information.
   * @param doctorId The UUID of the doctor to update.
   * @param doctor The updated doctor data.
   * @returns Observable of the updated DoctorUpdate object.
   */
  updateDoctor(doctorId: string, doctor: DoctorUpdate): Observable<DoctorUpdate> {
    return this.apiService.put<DoctorUpdate>(DOCTOR_ENDPOINTS.UPDATE(doctorId), doctor).pipe(
      catchError((error) => this.handleError(error, `Failed to update doctor ${doctorId}`))
    );
  }

  /**
   * Adds a schedule to a doctor.
   * @param doctorId The UUID of the doctor.
   * @param scheduleId The UUID of the schedule to add.
   * @returns Observable of the updated MedicalSchedule object.
   */
  addSchedule(doctorId: string, scheduleId: string): Observable<MedicalSchedule> {
    const params = new HttpParams().set('doc_id', doctorId).set('schedule_id', scheduleId);
    return this.apiService.put<MedicalSchedule>(SCHEDULE_ENDPOINTS.ADD_DOCTOR, {}, { params }).pipe(
      catchError((error) =>
        this.handleError(error, `Failed to add schedule ${scheduleId} to doctor ${doctorId}`)
      )
    );
  }

  /**
   * Bans a doctor.
   * @param doctorId The UUID of the doctor to ban.
   * @returns Observable of an object containing the updated Doctor and a message.
   */
  banDoctor(doctorId: string): Observable<{ doc: Doctor; message: string }> {
    return this.apiService.put<{ doc: Doctor; message: string }>(
      DOCTOR_ENDPOINTS.BAN(doctorId),
      {}
    ).pipe(
      catchError((error) => this.handleError(error, `Failed to ban doctor ${doctorId}`))
    );
  }

  /**
   * Unbans a doctor.
   * @param doctorId The UUID of the doctor to unban.
   * @returns Observable of an object containing the updated Doctor and a message.
   */
  unbanDoctor(doctorId: string): Observable<{ doc: Doctor; message: string }> {
    return this.apiService.put<{ doc: Doctor; message: string }>(
      DOCTOR_ENDPOINTS.UNBAN(doctorId),
      {}
    ).pipe(
      catchError((error) => this.handleError(error, `Failed to unban doctor ${doctorId}`))
    );
  }

  /**
   * Converts an ISO date to a day of the week.
   * @param date ISO date string (e.g., '2025-05-15').
   * @returns Day of the week (e.g., 'Monday').
   */
  private getDayOfWeek(date: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(date);
    return days[d.getDay()];
  }

  /**
   * Handles HTTP errors, logging them and returning user-friendly messages.
   * Clears storage on 401 Unauthorized errors.
   * @param error The HTTP error response.
   * @param context The context message for logging.
   * @returns Observable with a formatted error message.
   */
  private handleError(error: any, context: string): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';

    if (error.status) {
      switch (error.status) {
        case 400:
          errorMessage = 'Solicitud inválida. Verifica los datos enviados.';
          break;
        case 401:
          errorMessage = 'No autorizado. Sesión expirada.';
          this.storage.clearStorage();
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Contacta al soporte.';
          break;
      }
    }

    this.logger.error(`${context}: ${errorMessage}`, error);
    return throwError(() => new Error(errorMessage));
  }
}