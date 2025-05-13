import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { DEPARTMENT_ENDPOINTS } from './department-endpoints';
import {
  Department,
  DepartmentCreate,
  DepartmentUpdate,
  DepartmentDelete,
} from '../interfaces/hospital.interfaces';

/**
 * Service to manage department-related operations, interacting with the backend API.
 */
@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  /**
   * Retrieves the list of all departments.
   * @returns Observable of an array of Department objects.
   */
  getDepartments(): Observable<Department[]> {
    return this.apiService.get<Department[]>(DEPARTMENT_ENDPOINTS.GET_ALL).pipe(
      map((response) => response || []),
      catchError((error) => this.handleError('Failed to fetch departments', error))
    );
  }

  /**
   * Retrieves a department by ID.
   * @param departmentId The ID of the department.
   * @returns Observable of a Department object.
   */
  getDepartmentById(departmentId: number): Observable<Department> {
    return this.apiService.get<Department>(DEPARTMENT_ENDPOINTS.GET_BY_ID(departmentId)).pipe(
      catchError((error) => this.handleError(`Failed to fetch department ${departmentId}`, error))
    );
  }

  /**
   * Creates a new department (superuser only).
   * @param department The department data to create.
   * @returns Observable of the created Department object.
   */
  addDepartment(department: DepartmentCreate): Observable<Department> {
    return this.apiService.post<Department>(DEPARTMENT_ENDPOINTS.ADD, department).pipe(
      catchError((error) => this.handleError('Failed to create department', error))
    );
  }

  /**
   * Deletes a department by ID (superuser only).
   * @param departmentId The ID of the department to delete.
   * @returns Observable of the DepartmentDelete response.
   */
  deleteDepartment(departmentId: number): Observable<DepartmentDelete> {
    return this.apiService.delete<DepartmentDelete>(DEPARTMENT_ENDPOINTS.DELETE(departmentId)).pipe(
      catchError((error) => this.handleError(`Failed to delete department ${departmentId}`, error))
    );
  }

  /**
   * Updates a department by ID (superuser only).
   * @param departmentId The ID of the department to update.
   * @param department The updated department data.
   * @returns Observable of the updated Department object.
   */
  updateDepartment(departmentId: number, department: DepartmentUpdate): Observable<Department> {
    return this.apiService.patch<Department>(
      DEPARTMENT_ENDPOINTS.UPDATE(departmentId),
      department
    ).pipe(
      catchError((error) => this.handleError(`Failed to update department ${departmentId}`, error))
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