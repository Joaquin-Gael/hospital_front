import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '../../../services/user/user.service';
import { LoggerService } from '../../../services/core/logger.service';
import { StorageService } from '../../../services/core/storage.service';

export interface CodeResponse {
  message: string;
  success: boolean;
}

export interface VerifyResponse {
  message: string;
  success: boolean;
  valid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private readonly userService = inject(UserService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  /**
   * Envía código de verificación por email
   * @param method Método de envío (solo 'email' por ahora según UserService)
   * @param contact Email del usuario
   * @returns Observable con respuesta del envío
   */
  sendCode(method: 'email' | 'phone', contact: string): Observable<CodeResponse> {
    this.logger.info(`Enviando código de verificación por ${method} a ${this.maskEmail(contact)}`);
    
    // Por ahora solo soportamos email según el UserService
    if (method !== 'email') {
      throw new Error('Solo se soporta verificación por email actualmente');
    }

    // Guardar el email para uso posterior
    this.storage.setTempResetEmail(contact);

    return this.userService.petitionRecoverPassword(contact).pipe(
      map(response => {
        this.logger.info('Respuesta del servidor al enviar código:', response);
        return {
          message: response.message || 'Código enviado exitosamente',
          success: true
        };
      })
    );
  }

  /**
   * Reenvía el código de verificación
   * @param method Método de reenvío
   * @param contact Email del usuario
   * @returns Observable con respuesta del reenvío
   */
  resendCode(method: 'email' | 'phone', contact: string): Observable<CodeResponse> {
    this.logger.info(`Reenviando código de verificación por ${method} a ${this.maskEmail(contact)}`);
    
    // Reusar la misma lógica que sendCode
    return this.sendCode(method, contact);
  }

  /**
   * Verifica el código ingresado por el usuario
   * @param code Código a verificar
   * @param method Método usado (necesario para determinar el email)
   * @returns Observable con respuesta de verificación
   */
  verifyCode(code: string, method: 'email' | 'phone'): Observable<VerifyResponse> {
    const email = this.storage.getTempResetEmail();
    
    if (!email) {
      throw new Error('No se encontró email para verificación. Reinicia el proceso.');
    }

    this.logger.info(`Verificando código para ${this.maskEmail(email)}`);

    return this.userService.verifyCode(email, code).pipe(
      map(response => {
        this.logger.info('Respuesta de verificación de código:', response);
        return {
          message: response.message || 'Código verificado exitosamente',
          success: response.success || true,
          valid: response.success || true
        };
      })
    );
  }

  /**
   * Enmascara el email para logs y mostrar al usuario
   * @param email Email a enmascarar
   * @returns Email enmascarado
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    
    const [local, domain] = email.split('@');
    
    if (local.length <= 2) {
      return `${local}***@${domain}`;
    }
    
    const maskedLocal = local.substring(0, 2) + '*'.repeat(Math.max(1, local.length - 3)) + local.slice(-1);
    return `${maskedLocal}@${domain}`;
  }
}