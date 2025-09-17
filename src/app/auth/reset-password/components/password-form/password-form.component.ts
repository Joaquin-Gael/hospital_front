import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PasswordService } from '../../services/password.service';
import { PasswordStrength, PasswordResetData } from '../../types/reset-password.types';

@Component({
  selector: 'app-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="password-form">
      <div class="password-form__header">
        <div class="password-form__icon">
          <i class="fas fa-lock"></i>
        </div>
        <h2 class="password-form__title">Crear nueva contraseña</h2>
        <p class="password-form__description">
          Tu identidad ha sido verificada. Ahora puedes establecer una nueva contraseña segura.
        </p>
      </div>

      <div class="security-notice">
        <div class="security-notice__icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        <div class="security-notice__content">
          <h4 class="security-notice__title">Recomendaciones de seguridad</h4>
          <ul class="security-notice__list">
            <li>Usa al menos 8 caracteres</li>
            <li>Incluye mayúsculas, minúsculas y números</li>
            <li>Agrega símbolos especiales (!&#64;#$%^&*)</li>
            <li>No uses información personal</li>
          </ul>
        </div>
      </div>

      <form [formGroup]="passwordForm" (ngSubmit)="onResetPassword()" novalidate>
        <div class="form-field">
          <label class="form-field__label" for="newPassword">
            Nueva contraseña
            <span class="form-field__required">*</span>
          </label>
          <div class="form-field__input-container">
            <input 
              [type]="showNewPassword ? 'text' : 'password'"
              id="newPassword"
              class="form-field__input"
              formControlName="newPassword"
              placeholder="Ingresa tu nueva contraseña"
            />
            <button 
              type="button"
              class="form-field__toggle-password"
              (click)="toggleNewPasswordVisibility()"
            >
              <i [class]="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          @if (passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched) {
            <div class="form-field__error">
              <i class="fas fa-exclamation-triangle"></i>
              {{ getFieldError('newPassword') }}
            </div>
          }
          
          @if (passwordForm.get('newPassword')?.value) {
            <div class="password-strength">
              <div class="password-strength__label">Seguridad de la contraseña:</div>
              <div class="password-strength__bar">
                <div 
                  class="password-strength__fill" 
                  [class]="'password-strength__fill--' + passwordStrength.level"
                  [style.width.%]="passwordStrength.percentage"
                ></div>
              </div>
              <span class="password-strength__text" [class]="'password-strength__text--' + passwordStrength.level">
                {{ passwordStrength.text }}
              </span>
            </div>
          }
        </div>

        <div class="form-field">
          <label class="form-field__label" for="confirmPassword">
            Confirmar nueva contraseña
            <span class="form-field__required">*</span>
          </label>
          <div class="form-field__input-container">
            <input 
              [type]="showConfirmPassword ? 'text' : 'password'"
              id="confirmPassword"
              class="form-field__input"
              formControlName="confirmPassword"
              placeholder="Confirma tu nueva contraseña"
            />
            <button 
              type="button"
              class="form-field__toggle-password"
              (click)="toggleConfirmPasswordVisibility()"
            >
              <i [class]="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          @if (passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched) {
            <div class="form-field__error">
              <i class="fas fa-exclamation-triangle"></i>
              {{ getFieldError('confirmPassword') }}
            </div>
          }
          @if (passwordForm.errors?.['passwordMismatch'] && passwordForm.get('confirmPassword')?.touched) {
            <div class="form-field__error">
              <i class="fas fa-exclamation-triangle"></i>
              Las contraseñas no coinciden
            </div>
          }
        </div>

        <div class="form-options">
          <label class="form-options__checkbox">
            <input 
              type="checkbox" 
              formControlName="closeOtherSessions"
            />
            <span class="form-options__checkmark"></span>
            <span class="form-options__text">
              Cerrar sesiones activas en otros dispositivos
              <span class="form-options__recommended">(Recomendado)</span>
            </span>
          </label>
        </div>

        <div class="form-actions">
          <button 
            type="button"
            class="btn btn--outline"
            [disabled]="isLoading"
            (click)="onGoBack()"
          >
            <i class="fas fa-arrow-left"></i>
            Atrás
          </button>
          
          <button 
            type="submit"
            class="btn btn--primary"
            [disabled]="passwordForm.invalid || isLoading"
          >
            @if (isLoading) {
              <i class="fas fa-spinner fa-spin"></i>
            } @else {
              <i class="fas fa-save"></i>
            }
            {{ isLoading ? 'Guardando...' : 'Restablecer contraseña' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./password-form.component.scss']
})
export class PasswordFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly passwordService = inject(PasswordService);

  @Input() isLoading = false;
  
  @Output() passwordReset = new EventEmitter<PasswordResetData>();
  @Output() goBack = new EventEmitter<void>();

  passwordForm!: FormGroup;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordStrength: PasswordStrength = {
    level: 'weak',
    percentage: 0,
    text: 'Muy débil'
  };

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.passwordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordService.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      closeOtherSessions: [true]
    }, { 
      validators: this.passwordService.passwordMatchValidator 
    });

    this.passwordForm.get('newPassword')?.valueChanges.subscribe(value => {
      if (value) {
        this.passwordStrength = this.passwordService.calculatePasswordStrength(value);
      } else {
        this.passwordStrength = {
          level: 'weak',
          percentage: 0,
          text: 'Muy débil'
        };
      }
    });
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onResetPassword(): void {
    if (this.passwordForm.invalid || this.isLoading) return;

    const formData: PasswordResetData = {
      newPassword: this.passwordForm.get('newPassword')!.value,
      closeOtherSessions: this.passwordForm.get('closeOtherSessions')!.value
    };

    this.passwordReset.emit(formData);
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  getFieldError(fieldName: string): string {
    const control = this.passwordForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['weakPassword']) {
        return 'La contraseña debe ser más segura';
      }
    }
    return '';
  }
}