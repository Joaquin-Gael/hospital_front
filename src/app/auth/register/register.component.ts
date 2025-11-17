import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../services/user/user.service';
import { AuthService } from '../../services/auth/auth.service';
import { UserCreate } from '../../services/interfaces/user.interfaces';
import { NotificationService } from '../../core/notification/services/notification.service';
import { LoggerService } from '../../services/core/logger.service';
import { HeroComponent, HeroData } from '../../shared/hero/hero.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, HeroComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly loggerService = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthClass = '';
  isSubmitting = false;
  feedbackMessage: string | null = null;
  feedbackType: 'success' | 'error' | 'warning' | 'info' | null = null;

  // 👇 hero para registro
  readonly heroData: HeroData = {
    backgroundImage: 'assets/hero-three.png',
    altText: 'Registro de paciente Hospital SDLG',
    title: 'Creá tu cuenta de paciente',
    subtitle: 'Gestioná tus turnos, estudios y datos médicos ',
    highlightText: ' 100% gratuito',
  };

  readonly bloodTypeOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  readonly registerForm: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      blood_type: [''],
    },
    { validators: [RegisterComponent.passwordMatchValidator] }
  );

  static passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  generateUsername(firstName: string, lastName: string): string {
    const cleanFirst = firstName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const cleanLast = lastName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return `${cleanFirst.charAt(0)}${cleanLast}`;
  }

  checkPasswordStrength() {
    const password = this.registerForm.get('password')?.value;

    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';
      return;
    }

    let strength = 0;

    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;

    this.passwordStrength = strength;

    if (strength < 40) {
      this.passwordStrengthText = 'Débil';
      this.passwordStrengthClass = 'weak';
    } else if (strength < 70) {
      this.passwordStrengthText = 'Media';
      this.passwordStrengthClass = 'medium';
    } else {
      this.passwordStrengthText = 'Fuerte';
      this.passwordStrengthClass = 'strong';
    }
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.feedbackMessage =
        'Por favor completá correctamente todos los campos.';
      this.feedbackType = 'error';
      return;
    }

    this.isSubmitting = true;
    this.feedbackMessage = null;

    const { email, first_name, last_name, dni, password, blood_type } =
      this.registerForm.value;
    const username = this.generateUsername(first_name, last_name);

    const payload: UserCreate = {
      email,
      username,
      first_name,
      last_name,
      dni,
      health_insurance: [],
      password,
      blood_type: blood_type || undefined,
    };

    this.userService
      .createUser(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService.success(
            '¡Te registraste con éxito. Iniciá sesión.',
            {
              duration: 5000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            }
          );
          this.loggerService.debug('Usuario registrado: ', payload);
          setTimeout(() => this.router.navigateByUrl('/login'), 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg =
            err?.error?.message ||
            err?.message ||
            'Ocurrió un error inesperado.';
          this.notificationService.error(
            '¡Error al registrar usuario, por favor intentá nuevamente!',
            {
              duration: 5000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            }
          );
          this.loggerService.error('Algo salió mal: ', msg);
        },
      });
  }

  closeFeedback(): void {
    this.feedbackMessage = null;
    this.feedbackType = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}