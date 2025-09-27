import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { 
  ResetStep, 
  RESET_FLOW_STEPS, 
  STEPS_INFO, 
  PROGRESS_STEPS,
  UserProfile,
  PasswordResetData
} from '../types/reset-password.types';
import { VerificationService } from '../services/verification.service';
import { PasswordService } from '../services/password.service';
import { LoggerService } from '../../../services/core/logger.service';
import { StorageService } from '../../../services/core/storage.service';
import { MethodSelectionComponent } from '../components/method-selection/method-selection.component';
import { CodeVerificationComponent } from '../components/code-verification/code-verification.component';
import { PasswordFormComponent } from '../components/password-form/password-form.component';
import { SuccessMessageComponent } from '../components/success-message/success-message.component';

@Component({
  selector: 'app-reset-password-flow',
  standalone: true,
  imports: [
    CommonModule,
    MethodSelectionComponent,
    CodeVerificationComponent,
    PasswordFormComponent,
    SuccessMessageComponent
  ],
  template: `
    <div class="reset-password-flow">
      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <div class="progress-indicator__header">
          <h1 class="progress-indicator__title">Restablecer Contraseña</h1>
          <p class="progress-indicator__subtitle">
            {{ getStepInfo().title }}
          </p>
        </div>
        
        <div class="progress-indicator__steps">
          <div class="progress-steps">
            @for (step of progressSteps; track step.id) {
              <div 
                class="progress-step"
                [class.progress-step--active]="step.id <= getStepInfo().step"
                [class.progress-step--completed]="step.id < getStepInfo().step"
              >
                <div class="progress-step__circle">
                  @if (step.id < getStepInfo().step) {
                    <i class="fas fa-check"></i>
                  } @else {
                    <span>{{ step.id }}</span>
                  }
                </div>
                <span class="progress-step__label">{{ step.label }}</span>
              </div>
            }
          </div>
          <div class="progress-bar">
            <div 
              class="progress-bar__fill" 
              [style.width.%]="(getStepInfo().step / getStepInfo().total) * 100"
            ></div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="reset-password-form">
        <!-- Mensaje de error si no hay email -->
        @if (!userProfile) {
          <div class="error-container">
            <div class="error-message">
              <i class="fas fa-exclamation-triangle"></i>
              <h2>Email requerido</h2>
              <p>Para restablecer tu contraseña, primero debes ingresar tu email en el formulario de inicio de sesión.</p>
              <button 
                type="button"
                class="btn btn--primary"
                (click)="goToLogin()"
              >
                <i class="fas fa-arrow-left"></i>
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        }

        @if (userProfile) {
          <div class="step-content" [class.step-content--loading]="isLoading">
            <!-- Mensaje de error específico -->
            @if (errorMessage && currentStep === 'new-password') {
              <div class="error-container">
                <div class="error-message">
                  <i class="fas fa-exclamation-triangle"></i>
                  <p>{{ errorMessage }}</p>
                </div>
              </div>
            }
            
            @switch (currentStep) {
              @case ('method-selection') {
                <app-method-selection
                  [userProfile]="userProfile"
                  [isLoading]="isLoading"
                  (methodSelected)="handleMethodSelection($event)"
                  (goToProfile)="goToLogin()"
                />
              }
              
              @case ('code-sent') {
                <div class="code-sent">
                  <div class="code-sent__header">
                    <div class="code-sent__icon">
                      <i class="fas fa-paper-plane"></i>
                    </div>
                    <h2 class="code-sent__title">Código enviado</h2>
                    <p class="code-sent__description">
                      Hemos enviado un código de verificación a tu {{ getMethodName() }}.
                      El código expirará en 10 minutos.
                    </p>
                  </div>

                  <div class="sent-details">
                    <div class="sent-details__item">
                      <i class="fas fa-{{ getMethodIcon() }}"></i>
                      <span>{{ getMethodContact() }}</span>
                    </div>
                  </div>

                  <div class="code-sent__actions">
                    <button 
                      type="button"
                      class="btn btn--primary"
                      (click)="goToCodeVerification()"
                    >
                      <i class="fas fa-keyboard"></i>
                      Ingresar código
                    </button>
                    
                    <button 
                      type="button"
                      class="btn btn--outline"
                      (click)="goBack()"
                    >
                      <i class="fas fa-arrow-left"></i>
                      Cambiar método
                    </button>
                  </div>
                </div>
              }

              @case ('code-verification') {
                <app-code-verification
                  [methodName]="getMethodName()"
                  [isLoading]="isLoading"
                  [isResending]="isResending"
                  (codeVerified)="handleCodeVerification($event)"
                  (resendCode)="handleResendCode()"
                  (goBack)="goBack()"
                  #codeVerificationComponent
                />
              }

              @case ('new-password') {
                <app-password-form
                  [isLoading]="isLoading"
                  (passwordReset)="handlePasswordReset($event)"
                  (goBack)="goBack()"
                />
              }

              @case ('success') {
                <app-success-message
                  [sessionsClosed]="sessionsClosed"
                  (goToProfile)="goToLogin()"
                  (goToDashboard)="goToDashboard()"
                />
              }
            }
            
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./reset-password-flow.container.scss']
})
export class ResetPasswordFlowContainer implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly verificationService = inject(VerificationService);
  private readonly passwordService = inject(PasswordService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('codeVerificationComponent') codeVerificationComponent!: CodeVerificationComponent;

  // Component State
  currentStep: ResetStep = 'method-selection';
  isLoading = false;
  isResending = false;
  sessionsClosed = false;
  errorMessage: string | null = null; // Nueva propiedad para mensajes de error

  progressSteps = PROGRESS_STEPS;

  userProfile: UserProfile | null = null;
  selectedMethod: 'email' | 'phone' | null = null;

  ngOnInit(): void {
    this.logger.info('Iniciando flujo de restablecimiento de contraseña');
    this.initializeUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.storage.removeTempResetEmail();
    this.storage.removeItem('reset_user_profile');
  }

  private initializeUserProfile(): void {
    const savedProfile = this.storage.getItem('reset_user_profile');
    if (savedProfile) {
      try {
        this.userProfile = JSON.parse(savedProfile);
        this.logger.info('Perfil completo de usuario cargado para reset:', {
          email: this.maskEmailForLog(this.userProfile!.email ?? ''),
          hasEmail: this.userProfile!.hasEmail,
          hasPhone: this.userProfile!.hasPhone
        });
        return;
      } catch (error) {
        this.logger.warn('Error al parsear perfil guardado:', error);
        this.storage.removeItem('reset_user_profile');
      }
    }

    const tempEmail = this.storage.getTempResetEmail();
    if (tempEmail) {
      this.userProfile = {
        email: tempEmail,
        phone: undefined,
        hasEmail: true,
        hasPhone: false
      };

      this.logger.info('Email temporal cargado para reset:', {
        email: this.maskEmailForLog(tempEmail),
        hasEmail: true,
        hasPhone: false
      });
      return;
    }

    // Si no hay ningún dato, mostrar error
    this.logger.warn('No se encontraron datos para reset de contraseña');
    this.userProfile = null;
  }

  private maskEmailForLog(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.substring(0, 2)}***@${domain}`;
  }

  // Navigation
  getStepInfo() {
    return STEPS_INFO[this.currentStep];
  }

  goToNextStep(): void {
    const currentIndex = RESET_FLOW_STEPS.indexOf(this.currentStep);
    if (currentIndex < RESET_FLOW_STEPS.length - 1) {
      this.currentStep = RESET_FLOW_STEPS[currentIndex + 1];
    }
  }

  goBack(): void {
    const stepTransitions: Record<ResetStep, ResetStep | null> = {
      'method-selection': null,
      'code-sent': 'method-selection',
      'code-verification': 'code-sent',
      'new-password': 'code-verification',
      'success': null
    };

    const previousStep = stepTransitions[this.currentStep];
    if (previousStep) {
      this.currentStep = previousStep;
    } else {
      this.goToLogin();
    }
  }

  goToCodeVerification(): void {
    this.currentStep = 'code-verification';
  }

  // Method Handlers
  handleMethodSelection(method: 'email' | 'phone'): void {
    if (!this.userProfile) {
      this.logger.error('No hay perfil de usuario disponible');
      this.errorMessage = 'No se encontró información del usuario. Por favor, reinicia el proceso.';
      return;
    }

    this.selectedMethod = method;
    this.isLoading = true;
    this.errorMessage = null; // Limpiar errores anteriores

    const contact = method === 'email' ? this.userProfile.email! : this.userProfile.phone!;

    this.verificationService.sendCode(method, contact)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.logger.info('Código enviado exitosamente', response);
          this.currentStep = 'code-sent';
        },
        error: (error) => {
          this.logger.error('Error enviando código', error);
          this.errorMessage = 'Error al enviar el código de verificación. Por favor, intenta de nuevo.';
        }
      });
  }

  handleCodeVerification(code: string): void {
    this.isLoading = true;
    this.errorMessage = null; // Limpiar errores anteriores

    this.verificationService.verifyCode(code, this.selectedMethod!)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.logger.info('Código verificado exitosamente', response);
          this.currentStep = 'new-password';
        },
        error: (error) => {
          this.logger.error('Error verificando código', error);
          this.codeVerificationComponent.setError('Código incorrecto o expirado. Verifica e inténtalo de nuevo.');
        }
      });
  }

  handleResendCode(): void {
    if (!this.userProfile) {
      this.logger.error('No hay perfil de usuario disponible para reenvío');
      this.errorMessage = 'No se encontró información del usuario. Por favor, reinicia el proceso.';
      return;
    }

    this.isResending = true;
    this.errorMessage = null; // Limpiar errores anteriores
    
    const contact = this.selectedMethod === 'email' 
      ? this.userProfile.email! 
      : this.userProfile.phone!;

    this.verificationService.resendCode(this.selectedMethod!, contact)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isResending = false)
      )
      .subscribe({
        next: (response) => {
          this.logger.info('Código reenviado exitosamente', response);
          this.codeVerificationComponent.resetTimer(600); // 10 minutos
        },
        error: (error) => {
          this.logger.error('Error reenviando código', error);
          this.errorMessage = 'Error al reenviar el código. Por favor, intenta de nuevo.';
        }
      });
  }

  handlePasswordReset(data: PasswordResetData): void {
    this.isLoading = true;
    this.errorMessage = null; // Limpiar errores anteriores

    this.passwordService.resetPassword(data.newPassword, data.closeOtherSessions)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.logger.info('Contraseña restablecida exitosamente', response);
          this.sessionsClosed = response.sessionsClosed || false;
          this.currentStep = 'success';
          this.storage.removeTempResetEmail();
          this.storage.removeItem('verification_code');
        },
        error: (error) => {
          this.logger.error('Error restableciendo contraseña', error);
          // Manejo de errores específicos
          let errorMessage = 'Ocurrió un error al restablecer la contraseña. Por favor, intenta de nuevo.';
          
          if (error.status === 400) {
            if (error.error?.message.includes('code')) {
              errorMessage = 'El código de verificación es inválido o ha expirado.';
            } else if (error.error?.message.includes('password')) {
              errorMessage = 'La contraseña no cumple con los requisitos de seguridad.';
            }
          } else if (error.status === 401) {
            errorMessage = 'No autorizado. Por favor, verifica tu identidad nuevamente.';
          } else if (error.status === 500) {
            errorMessage = 'Error en el servidor. Intenta de nuevo más tarde.';
          }

          this.errorMessage = errorMessage;
        }
      });
  }

  getMethodName(): string {
    return this.selectedMethod === 'email' ? 'correo electrónico' : 'teléfono móvil';
  }

  getMethodIcon(): string {
    return this.selectedMethod === 'email' ? 'envelope' : 'mobile-alt';
  }

  getMethodContact(): string {
    if (!this.userProfile) return '';
    
    if (this.selectedMethod === 'email') {
      return this.verificationService.maskEmail(this.userProfile.email!);
    }
    return this.userProfile.phone || '';
  }

  goToLogin(): void {
    this.storage.removeTempResetEmail();
    this.storage.removeItem('reset_user_profile');
    this.router.navigate(['/login']);
  }

  goToProfile(): void {
    this.storage.removeTempResetEmail();
    this.storage.removeItem('reset_user_profile');
    this.router.navigate(['/user-panel/profile']);
  }

  goToDashboard(): void {
    this.storage.removeTempResetEmail();
    this.storage.removeItem('reset_user_profile');
    this.router.navigate(['/dashboard']);
  }
}