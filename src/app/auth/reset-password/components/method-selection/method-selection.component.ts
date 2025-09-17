import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../types/reset-password.types';

@Component({
  selector: 'app-method-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="method-selection">
      <div class="method-selection__header">
        <div class="method-selection__icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        <h2 class="method-selection__title">
          Verificación de seguridad requerida
        </h2>
        <p class="method-selection__description">
          Para restablecer tu contraseña, necesitamos verificar tu identidad mediante uno de los siguientes métodos:
        </p>
      </div>

      @if (hasRecoveryMethods()) {
        <div class="method-options">
          @if (userProfile.hasEmail) {
            <button 
              type="button"
              class="method-option"
              [disabled]="isLoading"
              (click)="onMethodSelect('email')"
            >
              <div class="method-option__icon">
                <i class="fas fa-envelope"></i>
              </div>
              <div class="method-option__content">
                <h3 class="method-option__title">Correo electrónico</h3>
                <p class="method-option__description">
                  Enviaremos un código a {{ maskEmail(userProfile.email!) }}
                </p>
              </div>
              <div class="method-option__arrow">
                <i class="fas fa-chevron-right"></i>
              </div>
            </button>
          }

          @if (userProfile.hasPhone) {
            <button 
              type="button"
              class="method-option"
              [disabled]="isLoading"
              (click)="onMethodSelect('phone')"
            >
              <div class="method-option__icon">
                <i class="fas fa-mobile-alt"></i>
              </div>
              <div class="method-option__content">
                <h3 class="method-option__title">Teléfono móvil</h3>
                <p class="method-option__description">
                  Enviaremos un SMS a {{ userProfile.phone }}
                </p>
              </div>
              <div class="method-option__arrow">
                <i class="fas fa-chevron-right"></i>
              </div>
            </button>
          }
        </div>
      } @else {
        <div class="no-recovery-methods">
          <div class="no-recovery-methods__icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="no-recovery-methods__title">
            No tienes métodos de recuperación configurados
          </h3>
          <p class="no-recovery-methods__description">
            Para restablecer tu contraseña, necesitas tener configurado al menos un método de recuperación (correo electrónico o teléfono). 
            Contacta con el administrador para obtener ayuda.
          </p>
          <button 
            type="button" 
            class="btn btn--outline"
            (click)="onGoToProfile()"
          >
            <i class="fas fa-user-cog"></i>
            Ir a configuración
          </button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./method-selection.component.scss']
})
export class MethodSelectionComponent {
  @Input() userProfile!: UserProfile;
  @Input() isLoading = false;
  
  @Output() methodSelected = new EventEmitter<'email' | 'phone'>();
  @Output() goToProfile = new EventEmitter<void>();

  hasRecoveryMethods(): boolean {
    return this.userProfile.hasEmail || this.userProfile.hasPhone;
  }

  onMethodSelect(method: 'email' | 'phone'): void {
    if (!this.isLoading) {
      this.methodSelected.emit(method);
    }
  }

  onGoToProfile(): void {
    this.goToProfile.emit();
  }

  maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.slice(-1);
    return `${maskedLocal}@${domain}`;
  }
}