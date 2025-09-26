import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { LoggerService } from '../core/logger.service';
import { StorageService } from '../core/storage.service';
import { USER_ENDPOINTS } from './user-endpoints';
import { UserRead, UserCreate, UserUpdate, UserDelete, RecoverPasswordPetition, DniVerification } from '../interfaces/user.interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private readonly apiService: ApiService,
    private readonly logger: LoggerService,
    private readonly storage: StorageService
  ) {}

  /**
   * Obtiene la lista de usuarios.
   * @returns Observable con la lista de usuarios.
   */
  getUsers(): Observable<UserRead[]> {
    return this.apiService.get<UserRead[]>(USER_ENDPOINTS.USERS).pipe(
      map(response => response || []),
      catchError(error => this.handleError('Get users', error))
    );
  }

  /**
   * Obtiene un usuario por ID.
   * @param userId ID del usuario.
   * @returns Observable con los datos del usuario.
   */
  getUserById(userId: string): Observable<UserRead> {
    return this.apiService.get<UserRead>(USER_ENDPOINTS.USER_BY_ID(userId)).pipe(
      catchError(error => this.handleError('Get user by ID', error))
    );
  }

  /**
   * Crea un nuevo usuario.
   * @param user Datos del usuario a crear.
   * @returns Observable con los datos del usuario creado.
   */
  createUser(user: UserCreate): Observable<UserRead> {
    const formData = new FormData();
    formData.append('username', user.username);
    formData.append('dni', user.dni);
    formData.append('email', user.email);
    formData.append('password', user.password);
    if (user.health_insurance && user.health_insurance.length > 0) {
      user.health_insurance.forEach(id => formData.append('health_insurance_id', id));
    }
    formData.append('blood_type', user.blood_type);
    formData.append('first_name', user.first_name);
    formData.append('last_name', user.last_name);
    formData.append('telephone', user.telephone || '');

    this.logger.debug('Creating user with data:', formData);
    
    return this.apiService.post<UserRead>(USER_ENDPOINTS.ADD, formData).pipe(
      catchError(error => this.handleError('Create user', error))
    );
  }

  /**
   * Actualiza un usuario existente.
   * @param userId ID del usuario.
   * @param user Datos actualizados del usuario.
   * @param imgProfile Archivo de imagen de perfil (opcional).
   * @returns Observable con los datos del usuario actualizado.
   */
  updateUser(userId: string, user: UserUpdate): Observable<UserRead> {
    const formData = new FormData();
    formData.append('username', user.username || '');
    formData.append('first_name', user.first_name || '');
    formData.append('last_name', user.last_name || '');
    formData.append('telephone', user.telephone || '');
    formData.append('address', user.address || '');
    if (user.health_insurance && user.health_insurance.length > 0) {
      user.health_insurance.forEach(id => formData.append('health_insurance_id', id));
    }
    if (user.img_profile instanceof File) {
      formData.append('img_profile', user.img_profile, user.img_profile.name);
    }
    return this.apiService.patch<UserRead>(USER_ENDPOINTS.UPDATE(userId), formData).pipe(
      catchError(error => this.handleError(`Update user ${userId}`, error))
    );
  }

  /**
   * Elimina un usuario.
   * @param userId ID del usuario.
   * @returns Observable con la respuesta de eliminación.
   */
  deleteUser(userId: string): Observable<UserDelete> {
    return this.apiService.delete<UserDelete>(USER_ENDPOINTS.DELETE(userId)).pipe(
      catchError(error => this.handleError('Delete user', error))
    );
  }

  /**
   * Banea a un usuario.
   * @param userId ID del usuario.
   * @returns Observable con los datos del usuario baneado.
   */
  banUser(userId: string): Observable<UserRead> {
    return this.apiService.patch<{ user: UserRead; message: string }>(USER_ENDPOINTS.BAN(userId), {}).pipe(
      map(response => response.user),
      catchError(error => this.handleError('Ban user', error))
    );
  }

  /**
   * Desbanea a un usuario.
   * @param userId ID del usuario.
   * @returns Observable con los datos del usuario desbaneado.
   */
  unbanUser(userId: string): Observable<UserRead> {
    return this.apiService.patch<{ user: UserRead; message: string }>(USER_ENDPOINTS.UNBAN(userId), {}).pipe(
      map(response => response.user),
      catchError(error => this.handleError('Unban user', error))
    );
  }

  petitionRecoverPassword(email: string): Observable<RecoverPasswordPetition> {
    return this.apiService.post<RecoverPasswordPetition>(USER_ENDPOINTS.RECOVER_PASSWORD, email).pipe(
      catchError(error => this.handleError('Petition recover password', error))
    );
  }

  /** 
  * Verifica el DNI de un usuario.
  * @param file archivo a subir
  * @returns Observable con los archivos subidos
  */
  verifyDni(file1: File, file2: File): Observable<DniVerification> {
    const formData = new FormData();
    formData.append('front', file1, file1.name);
    formData.append('back', file2, file2.name);
    return this.apiService.post<DniVerification>(USER_ENDPOINTS.VERIFY_DNI, formData).pipe(
      catchError(error => this.handleError('Verify DNI', error))
    );
  }

  /**
   * Maneja errores de las peticiones HTTP.
   * @param operation Nombre de la operación que falló.
   * @param error Objeto de error.
   * @returns Observable con el error transformado.
   */
  private handleError(operation: string, error: unknown): Observable<never> {
    this.logger.error(`${operation} failed`, error);

    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'status' in error) {
      const httpError = error as { status: number; error?: { detail?: string | { loc: string[]; type: string; msg: string }[] } };
      switch (httpError.status) {
        case 400:
          errorMessage = this.formatErrorDetail(httpError.error?.detail) ?? 'Invalid request data';
          break;
        case 401:
          errorMessage = this.formatErrorDetail(httpError.error?.detail) ?? 'Unauthorized access';
          this.storage.clearStorage();
          break;
        case 403:
          errorMessage = this.formatErrorDetail(httpError.error?.detail) ?? 'Forbidden action';
          break;
        case 404:
          errorMessage = this.formatErrorDetail(httpError.error?.detail) ?? 'Resource not found';
          break;
        case 422:
          errorMessage = this.formatErrorDetail(httpError.error?.detail) ?? 'Invalid data format';
          break;
        default:
          errorMessage = this.formatErrorDetail(httpError.error?.detail) ?? 'Server error';
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  private formatErrorDetail(detail: string | { loc: string[]; type: string; msg: string }[] | undefined): string | undefined {
    if (typeof detail === 'string') {
      return detail;
    } else if (Array.isArray(detail)) {
      return detail.map(err => `${err.loc.join('.')} (${err.type}): ${err.msg}`).join('; ');
    }
    return undefined;
  }
}