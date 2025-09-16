import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LoggerService } from '../../../services/core/logger.service';
import { NotificationService } from '../../../core/notification';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password-form.component.html',
  styleUrls: ['./change-password-form.component.scss']
})
export class ChangePasswordFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly logger = inject(LoggerService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
   
  loading: boolean = false;
  @Input() isSubmitting: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  changePasswordForm!: FormGroup;
  
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Password strength
  passwordStrength = {
    level: 'weak',
    percentage: 0,
    text: 'Muy débil'
  };

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });

    this.changePasswordForm.get('newPassword')?.valueChanges.subscribe(value => {
      if (value) {
        this.calculatePasswordStrength(value);
      } else {
        this.passwordStrength = {
          level: 'weak',
          percentage: 0,
          text: 'Muy débil'
        };
      }
    });
  }

  // Validador personalizado para la fuerza de la contraseña
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasMinLength = value.length >= 8;

    const validConditions = [hasUpperCase, hasLowerCase, hasNumeric, hasSpecialChar, hasMinLength];
    const validCount = validConditions.filter(condition => condition).length;

    if (validCount < 3) {
      return { weakPassword: true };
    }

    return null;
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  private calculatePasswordStrength(password: string): void {
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
      this.passwordStrength = {
        level: 'weak',
        percentage: 25,
        text: 'Muy débil'
      };
    } else if (score <= 4) {
      this.passwordStrength = {
        level: 'fair',
        percentage: 50,
        text: 'Débil'
      };
    } else if (score <= 6) {
      this.passwordStrength = {
        level: 'good',
        percentage: 75,
        text: 'Buena'
      };
    } else {
      this.passwordStrength = {
        level: 'strong',
        percentage: 100,
        text: 'Muy segura'
      };
    }
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
    if (this.changePasswordForm.valid) {
      const formData = {
        currentPassword: this.changePasswordForm.get('currentPassword')?.value,
        newPassword: this.changePasswordForm.get('newPassword')?.value
      };
      
      try {
        this.formSubmit.emit(formData);
        this.notificationService.success('¡Contraseña cambiada con éxito!', {
          duration: 7000,
          action: {
            label: 'Cerrar',
            action: () => this.notificationService.dismissAll(),
          },
        });
      } catch (error) {
        this.logger.error('Error al cambiar contraseña:', error);
        this.notificationService.error('Error al cambiar la contraseña. Inténtalo nuevamente.', {
          duration: 7000,
          action: {
            label: 'Cerrar',
            action: () => this.notificationService.dismissAll(),
          },
        });
      }
      
    } else {
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
      this.logger.error('Formulario inválido');
      this.notificationService.warning('Por favor, completa todos los campos correctamente', {
        duration: 5000,
        action: {
          label: 'Cerrar',
          action: () => this.notificationService.dismissAll(),
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/user_panel/profile']); 
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