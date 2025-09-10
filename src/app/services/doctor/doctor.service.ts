import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
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
  DoctorUpdateResponse,
  DoctorDelete,
  DoctorMeResponse,
  MedicalSchedule,
  DoctorUpdatePassword,
  DoctorStatsResponse
} from '../interfaces/doctor.interfaces';
import { UserRead } from '../interfaces/user.interfaces';
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
  private scheduleCache: { [key: string]: MedicalSchedule[] } = {};

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

  getDoctorPatients(doctorId: string): Observable<UserRead> {
    return this.apiService
      .get<UserRead>(DOCTOR_ENDPOINTS.GET_PATIENTS(doctorId))
      .pipe(
        catchError((error) =>
        this.handleError(error, `Failed to fetch doctor ${doctorId}`)
      )
    );
  }

  getDoctorStats(doctorId: string): Observable<DoctorStatsResponse> {
    return this.apiService
      .get<DoctorStatsResponse>(DOCTOR_ENDPOINTS.GET_STATS(doctorId))
      .pipe(
        catchError((error) =>
          this.handleError(error, `Failed to fetch doctor ${doctorId}`)
        )
      );
  }

  /**
   * Retrieves doctors by speciality ID.
   * @param specialityId The UUID of the speciality.
   * @returns Observable of an array of Doctor objects.
   */
  getDoctorsBySpeciality(specialityId: string): Observable<Doctor[]> {
    const params = new HttpParams().set('speciality_id', specialityId);
    return this.apiService
      .get<Doctor[]>(DOCTOR_ENDPOINTS.GET_ALL, { params })
      .pipe(
        map((response) => response || []),
        catchError((error) =>
          this.handleError(
            error,
            `Failed to fetch doctors for speciality ${specialityId}`
          )
        )
      );
  }

  /**
     * Retrieves available schedules for a service, filtered by specialty and optional date.
     * @param serviceId The ID of the service.
     * @param date Optional date to filter schedules (ISO format, e.g., '2025-08-08').
     * @returns Observable of an array of MedicalSchedule objects.
     */
    getAvailableSchedules(serviceId: string, date?: string): Observable<MedicalSchedule[]> {
      const cacheKey = date ? `${serviceId}_${date}` : `${serviceId}`;
      if (this.scheduleCache[cacheKey]) {
        return of(this.scheduleCache[cacheKey]);
      }

      return this.serviceService.getServiceById(serviceId).pipe(
        switchMap((service: Service) => {
          if (!service) {
            return throwError(() => new Error(`Service ${serviceId} not found`));
          }
          const params = new HttpParams()
            .set('specialty_id', service.specialty_id)
            .set('date', date || '');
          return this.apiService.get<MedicalSchedule[]>(SCHEDULE_ENDPOINTS.GET_ALL, { params }).pipe(
            map((schedules) => schedules.filter(schedule => schedule.doctors?.length > 0)), // Solo horarios con doctores
            map((response) => {
              this.scheduleCache[cacheKey] = response || [];
              return response;
            }),
            catchError((error) =>
              this.handleError(error, `Failed to fetch schedules for service ${serviceId}`)
            )
          );
        })
      );
    }

  /**
   * Retrieves a doctor by their ID.
   * @param doctorId The UUID of the doctor.
   * @returns Observable of a Doctor object.
   */
  getDoctorById(doctorId: string): Observable<Doctor> {
    return this.apiService
      .get<Doctor>(DOCTOR_ENDPOINTS.GET_BY_ID(doctorId))
      .pipe(
        catchError((error) =>
          this.handleError(error, `Failed to fetch doctor ${doctorId}`)
        )
      );
  }

  /**
   * Retrieves the authenticated doctor's details and schedules.
   * @returns Observable of a DoctorMeResponse object containing the doctor and their schedules.
   */
  getMe(): Observable<DoctorMeResponse> {
    return this.apiService
      .get<DoctorMeResponse>(DOCTOR_ENDPOINTS.GET_ME)
      .pipe(
        catchError((error) =>
          this.handleError(error, 'Failed to fetch authenticated doctor')
        )
      );
  }

  /**
   * Creates a new doctor.
   * @param doctor The doctor data to create.
   * @returns Observable of the created Doctor object.
   */
  createDoctor(doctor: DoctorCreate): Observable<Doctor> {
    return this.apiService
      .post<Doctor>(DOCTOR_ENDPOINTS.CREATE, doctor)
      .pipe(
        catchError((error) =>
          this.handleError(error, 'Failed to create doctor')
        )
      );
  }

  /**
   * Deletes a doctor by their ID.
   * @param doctorId The UUID of the doctor to delete.
   * @returns Observable of a DoctorDelete object with deletion confirmation.
   */
  deleteDoctor(doctorId: string): Observable<DoctorDelete> {
    return this.apiService
      .delete<DoctorDelete>(DOCTOR_ENDPOINTS.DELETE(doctorId))
      .pipe(
        catchError((error) =>
          this.handleError(error, `Failed to delete doctor ${doctorId}`)
        )
      );
  }

  /**
   * Deletes a schedule from a doctor.
   * @param doctorId The UUID of the doctor.
   * @param scheduleId The UUID of the schedule to delete.
   * @returns Observable of the updated Doctor object.
   */
  deleteDoctorSchedule(
    doctorId: string,
    scheduleId: string
  ): Observable<Doctor> {
    return this.apiService
      .delete<Doctor>(DOCTOR_ENDPOINTS.DELETE_SCHEDULE(doctorId, scheduleId))
      .pipe(
        catchError((error) =>
          this.handleError(
            error,
            `Failed to delete schedule ${scheduleId} for doctor ${doctorId}`
          )
        )
      );
  }

  /**
   * Updates a doctor's basic information (username, first_name, last_name, telephone, email).
   * @param doctorId The UUID of the doctor to update.
   * @param doctor The updated doctor data (limited to allowed fields).
   * @returns Observable of the updated Doctor object.
   */
  updateDoctor(
    doctorId: string,
    doctor: Partial<DoctorUpdate>
  ): Observable<DoctorUpdateResponse> {
    const allowedFields = {
      username: doctor.username,
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      telephone: doctor.telephone,
      email: doctor.email,
    };
    return this.apiService
      .patch<DoctorUpdateResponse>(
        DOCTOR_ENDPOINTS.UPDATE(doctorId),
        allowedFields
      )
      .pipe(
        map((response) => {
          console.log('Respuesta de updateDoctor:', response);
          return response;
        }),
        catchError((error) =>
          this.handleError(error, `Failed to update doctor ${doctorId}`)
        )
      );
  }
  /**
   * Updates a doctor's speciality.
   * @param doctorId The UUID of the doctor to update.
   * @param specialityId The UUID of the new speciality.
   * @returns Observable of the updated Doctor object.
   */
  updateDoctorSpeciality(
    doctorId: string,
    specialityId: string
  ): Observable<Doctor> {
    return this.apiService
      .patch<Doctor>(DOCTOR_ENDPOINTS.UPDATE_SPECIALITY(doctorId), {
        speciality_id: specialityId,
      })
      .pipe(
        catchError((error) =>
          this.handleError(
            error,
            `Failed to update speciality for doctor ${doctorId}`
          )
        )
      );
  }

  /**
   * Updates a doctor's password.
   * @param doctorId The UUID of the doctor to update.
   * @param password The new password.
   * @returns Observable of the updated Doctor object.
   */
  updateDoctorPassword(doctorId: string, doc_password: DoctorUpdatePassword): Observable<Doctor> {
    const formData = new FormData();
    formData.append('password', doc_password.password);
    return this.apiService
      .patch<Doctor>(DOCTOR_ENDPOINTS.UPDATE_PASSWORD(doctorId), formData )
      .pipe(
        catchError((error) =>
          this.handleError(
            error,
            `Failed to update password for doctor ${doctorId}`
          )
        )
      );
  }

  /**
   * Adds a schedule to a doctor.
   * @param doctorId The UUID of the doctor.
   * @param scheduleId The UUID of the schedule to add.
   * @returns Observable of the updated MedicalSchedule object.
   */
  addSchedule(
    doctorId: string,
    scheduleId: string
  ): Observable<MedicalSchedule> {
    const params = new HttpParams()
      .set('doc_id', doctorId)
      .set('schedule_id', scheduleId);
    return this.apiService
      .patch<MedicalSchedule>(DOCTOR_ENDPOINTS.ADD_SCHEDULE, {}, { params })
      .pipe(
        catchError((error) =>
          this.handleError(
            error,
            `Failed to add schedule ${scheduleId} to doctor ${doctorId}`
          )
        )
      );
  }

  /**
   * Bans a doctor.
   * @param doctorId The UUID of the doctor to ban.
   * @returns Observable of an object containing the updated Doctor and a message.
   */
  banDoctor(doctorId: string): Observable<{ doc: Doctor; message: string }> {
    return this.apiService
      .patch<{ doc: Doctor; message: string }>(
        DOCTOR_ENDPOINTS.BAN(doctorId),
        {}
      )
      .pipe(
        catchError((error) =>
          this.handleError(error, `Failed to ban doctor ${doctorId}`)
        )
      );
  }

  /**
   * Unbans a doctor.
   * @param doctorId The UUID of the doctor to unban.
   * @returns Observable of an object containing the updated Doctor and a message.
   */
  unbanDoctor(doctorId: string): Observable<{ doc: Doctor; message: string }> {
    return this.apiService
      .patch<{ doc: Doctor; message: string }>(
        DOCTOR_ENDPOINTS.UNBAN(doctorId),
        {}
      )
      .pipe(
        catchError((error) =>
          this.handleError(error, `Failed to unban doctor ${doctorId}`)
        )
      );
  }

  /**
   * Converts an ISO date to a day of the week.
   * @param date ISO date string (e.g., '2025-05-15').
   * @returns Day of the week (e.g., 'Monday').
   */
  private getDayOfWeek(date: string): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
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
    let errorMessage =
      'Ocurrió un error inesperado. Por favor, intenta de nuevo.';

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
