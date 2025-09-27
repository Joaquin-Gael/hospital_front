import { Injectable, inject } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from '../../../services/user/user.service';
import { LoggerService } from '../../../services/core/logger.service';
import { StorageService } from '../../../services/core/storage.service';
import { ResetPasswordResponse, PasswordStrength } from '../types/reset-password.types';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  private readonly userService = inject(UserService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  /**
   * Restablece la contraseña del usuario
   * @param newPassword Nueva contraseña
   * @param closeOtherSessions Si cerrar otras sesiones
   * @returns Observable con respuesta del restablecimiento
   */
  resetPassword(newPassword: string, closeOtherSessions: boolean = false): Observable<ResetPasswordResponse> {
    const email = this.storage.getTempResetEmail();
    const code = this.storage.getItem('verification_code');

    if (!email) {
      this.logger.error('No se encontró email para restablecer contraseña');
      return throwError(() => ({
        status: 400,
        error: { message: 'No se encontró email para restablecer contraseña. Reinicia el proceso.' }
      }));
    }

    if (!code) {
      this.logger.error('No se encontró código de verificación');
      return throwError(() => ({
        status: 400,
        error: { message: 'No se encontró código de verificación. Verifica tu código primero.' }
      }));
    }

    this.logger.info(`Restableciendo contraseña para ${this.maskEmail(email)}`);

    return this.userService.updatePassword(email, code, newPassword).pipe(
      map(response => {
        this.logger.info('Respuesta de restablecimiento de contraseña:', response);
        
        // Limpiar datos temporales después del éxito
        this.storage.removeItem('verification_code');
        this.storage.removeTempResetEmail();
        
        return {
          message: 'Contraseña restablecida exitosamente',
          success: true,
          sessionsClosed: closeOtherSessions
        };
      }),
      catchError(error => {
        // Simulamos validación de state = True
        if (error.status === 400 && error.error?.message.includes('code not verified')) {
          return throwError(() => ({
            status: 400,
            error: { message: 'El código de verificación no ha sido validado.' }
          }));
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Calcula la fortaleza de una contraseña (alias para validatePasswordStrength)
   * @param password Contraseña a validar
   * @returns Objeto con información de fortaleza
   */
  calculatePasswordStrength(password: string): PasswordStrength {
    const validation = this.validatePasswordStrength(password);
    return {
      level: validation.level,
      percentage: validation.percentage,
      text: validation.text
    };
  }

  /**
   * Valida la fortaleza de una contraseña
   * @param password Contraseña a validar
   * @returns Objeto con información de fortaleza
   */
  validatePasswordStrength(password: string): {
    level: 'weak' | 'fair' | 'good' | 'strong';
    percentage: number;
    text: string;
    criteria: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      numbers: boolean;
      symbols: boolean;
    };
  } {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(criteria).filter(Boolean).length;
    
    let level: 'weak' | 'fair' | 'good' | 'strong';
    let percentage: number;
    let text: string;

    switch (score) {
      case 0:
      case 1:
        level = 'weak';
        percentage = 20;
        text = 'Muy débil';
        break;
      case 2:
        level = 'weak';
        percentage = 40;
        text = 'Débil';
        break;
      case 3:
        level = 'fair';
        percentage = 60;
        text = 'Regular';
        break;
      case 4:
        level = 'good';
        percentage = 80;
        text = 'Buena';
        break;
      case 5:
        level = 'strong';
        percentage = 100;
        text = 'Muy fuerte';
        break;
      default:
        level = 'weak';
        percentage = 20;
        text = 'Muy débil';
    }

    return {
      level,
      percentage,
      text,
      criteria
    };
  }

  /**
   * Validador para fortaleza de contraseña
   * @returns ValidatorFn para usar en formularios reactivos
   */
  passwordStrengthValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const strength = this.validatePasswordStrength(control.value);
    
    if (strength.level === 'weak' && strength.percentage <= 40) {
      return { weakPassword: true };
    }

    return null;
  };

  /**
   * Validador para confirmar que las contraseñas coincidan
   * @returns ValidatorFn para usar en formularios reactivos
   */
  passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  };

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    
    const [local, domain] = email.split('@');
    
    if (local.length <= 2) {
      return `${local}***@${domain}`;
    }
    
    const maskedLocal = local.substring(0, 2) + '*'.repeat(Math.max(1, local.length - 3)) + local.slice(-1);
    return `${maskedLocal}@${domain}`;
  }
}