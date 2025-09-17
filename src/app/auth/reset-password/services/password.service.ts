import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { PasswordStrength } from '../types/reset-password.types';
import { LoggerService } from '../../../services/core/logger.service';

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  sessionsClosed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  private readonly logger = inject(LoggerService);

  resetPassword(
    newPassword: string, 
    closeOtherSessions: boolean
  ): Observable<PasswordResetResponse> {
    this.logger.info('Restableciendo contraseña', { closeOtherSessions });
    
    return of({
      success: true,
      message: 'Contraseña restablecida correctamente',
      sessionsClosed: closeOtherSessions
    }).pipe(delay(2000));
  }

  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<PasswordResetResponse> {
    this.logger.info('Cambiando contraseña');
    
    // Simular validación de contraseña actual y cambio
    return of({
      success: true,
      message: 'Contraseña cambiada correctamente'
    }).pipe(delay(2000));
  }

  calculatePasswordStrength(password: string): PasswordStrength {
    const criteria = [
      { test: /[a-z]/.test(password), points: 1 }, // minúsculas
      { test: /[A-Z]/.test(password), points: 1 }, // mayúsculas
      { test: /[0-9]/.test(password), points: 1 }, // números
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), points: 1 }, // símbolos
      { test: password.length >= 8, points: 1 }, // longitud mínima
      { test: password.length >= 12, points: 1 }, // longitud buena
      { test: !/(.)\1{2,}/.test(password), points: 1 }, // no repetición
      { test: !/123|abc|qwe|password/i.test(password), points: 1 } // no patrones comunes
    ];

    const score = criteria.reduce((total, criterion) => {
      return total + (criterion.test ? criterion.points : 0);
    }, 0);

    if (score <= 2) {
      return { level: 'weak', percentage: 25, text: 'Muy débil' };
    } else if (score <= 4) {
      return { level: 'fair', percentage: 50, text: 'Débil' };
    } else if (score <= 6) {
      return { level: 'good', percentage: 75, text: 'Buena' };
    } else {
      return { level: 'strong', percentage: 100, text: 'Muy segura' };
    }
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasMinLength = value.length >= 8;

    const validConditions = [hasUpperCase, hasLowerCase, hasNumeric, hasSpecialChar, hasMinLength];
    const validCount = validConditions.filter(condition => condition).length;

    return validCount < 3 ? { weakPassword: true } : null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }
}