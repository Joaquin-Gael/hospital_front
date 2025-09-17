import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PasswordService } from '../../services/password.service';
import { AuthService } from '../../../../../services/auth/auth.service';
import { StorageService } from '../../../../../services/core/storage.service';
import { LoggerService } from '../../../../../services/core/logger.service';
import { NotificationService } from '../../../../../core/notification/services/notification.service';
import { PasswordStrength } from '../../types/change-password.types';
import { UserRead } from '../../../../../services/interfaces/user.interfaces';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password-form.component.html',
  styleUrls: ['./change-password-form.component.scss']
})
export class ChangePasswordFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly passwordService = inject(PasswordService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  @Input() isSubmitting = false;
  @Output() formSubmit = new EventEmitter<ChangePasswordData>();
  @Output() formCancel = new EventEmitter<void>();

  changePasswordForm!: FormGroup;
  
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isLoadingUserData = false;

  passwordStrength: PasswordStrength = {
    level: 'weak',
    percentage: 0,
    text: 'Muy débil'
  };

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordService.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordService.passwordMatchValidator 
    });

    this.changePasswordForm.get('newPassword')?.valueChanges.subscribe(value => {
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

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid && !this.isSubmitting) {
      const formData: ChangePasswordData = {
        currentPassword: this.changePasswordForm.get('currentPassword')!.value,
        newPassword: this.changePasswordForm.get('newPassword')!.value
      };
      
      this.formSubmit.emit(formData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['user_panel/profile']);
  }

  onForgotPassword(): void {
    if (!this.authService.isLoggedIn()) {
      this.logger.warn('Usuario no autenticado intentando acceder al reset de contraseña');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoadingUserData = true;
    
    this.authService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: UserRead | null) => {
          this.isLoadingUserData = false;
          
          if (!user) {
            this.logger.error('No se pudieron obtener los datos del usuario autenticado');
            this.notificationService.error(
              'Error al obtener datos del usuario. Por favor, inicia sesión nuevamente.',
              { duration: 4000 }
            );
            this.router.navigate(['/login']);
            return;
          }

          if (!user.username) {
            this.logger.error('Usuario sin email encontrado');
            this.notificationService.error(
              'No se encontró un email asociado a tu cuenta.',
              { duration: 4000 }
            );
            return;
          }

          const userProfileForReset = {
            email: user.username, 
            phone: user.telephone || null,
            hasEmail: true,
            hasPhone: !!user.telephone
          };

          this.storage.setItem('reset_user_profile', JSON.stringify(userProfileForReset));
          
          this.logger.info('Datos de usuario guardados para reset de contraseña', {
            hasEmail: userProfileForReset.hasEmail,
            hasPhone: userProfileForReset.hasPhone,
            email: this.maskEmailForLog(userProfileForReset.email)
          });

          const methods = [];
          if (userProfileForReset.hasEmail) methods.push('correo electrónico');
          if (userProfileForReset.hasPhone) methods.push('teléfono');
          
          this.notificationService.success(
            `Redirigiendo al restablecimiento de contraseña. Podrás usar: ${methods.join(' o ')}.`,
            { duration: 3000 }
          );

          // Redirigir al flujo de reset
          setTimeout(() => {
            this.router.navigate(['/user_panel/recovery-password']);
          }, 1000);
        },
        error: (error) => {
          this.isLoadingUserData = false;
          this.logger.error('Error al obtener datos del usuario para reset', error);
          this.notificationService.error(
            'Error al obtener los datos de tu cuenta. Inténtalo nuevamente.',
            { duration: 4000 }
          );
        }
      });
  }

  private maskEmailForLog(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.substring(0, 2)}***@${domain}`;
  }

  getFieldError(fieldName: string): string {
    const control = this.changePasswordForm.get(fieldName);
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