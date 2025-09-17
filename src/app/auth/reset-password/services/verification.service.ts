import { Injectable, inject } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { LoggerService } from '../../../services/core/logger.service';

export interface VerificationCodeResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private readonly logger = inject(LoggerService);

  sendCode(method: 'email' | 'phone', contact: string): Observable<VerificationCodeResponse> {
    this.logger.info(`Enviando código de verificación por ${method} a ${contact}`);
    
    // Simular API call
    return of({
      success: true,
      message: `Código enviado a tu ${method === 'email' ? 'correo electrónico' : 'teléfono'}`,
      expiresIn: 600 // 10 minutos
    }).pipe(delay(2000));
  }

  verifyCode(code: string, method: 'email' | 'phone'): Observable<VerificationCodeResponse> {
    this.logger.info(`Verificando código: ${code} para método: ${method}`);
    
    // Simular verificación
    const isValidCode = code.length === 6 && /^\d+$/.test(code);
    
    return (isValidCode ? of({
      success: true,
      message: 'Código verificado correctamente'
    }) : throwError(() => new Error('Código incorrecto')))
    .pipe(delay(1500));
  }

  resendCode(method: 'email' | 'phone', contact: string): Observable<VerificationCodeResponse> {
    this.logger.info(`Reenviando código por ${method} a ${contact}`);
    
    return of({
      success: true,
      message: 'Código reenviado correctamente',
      expiresIn: 600
    }).pipe(delay(1500));
  }

  maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.slice(-1);
    return `${maskedLocal}@${domain}`;
  }
}