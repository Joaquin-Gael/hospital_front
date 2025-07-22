import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { Auth } from '../../services/interfaces/hospital.interfaces';
import { NotificationService } from '../../core/notification/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService); // Inyectamos el servicio
  private readonly destroy$ = new Subject<void>();

  showPassword = false;
  isSubmitting = false;

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false],
  });

  ngOnInit(): void {
    const savedEmail = localStorage.getItem('rememberEmail');
    if (!this.authService.isLoggedIn()) {
      if (savedEmail) {
        this.loginForm.patchValue({ email: savedEmail, remember: true });
      }
    } else {
      this.router.navigateByUrl('/home');
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      this.notificationService.error('Por favor completá correctamente el email y la contraseña.');
      return;
    }

    this.isSubmitting = true;

    const { email, password, remember } = this.loginForm.value;
    const sanitizedEmail = email.trim();

    if (remember) {
      localStorage.setItem('rememberEmail', sanitizedEmail);
    } else {
      localStorage.removeItem('rememberEmail');
    }

    const credentials: Auth = { email: sanitizedEmail, password };

    this.authService
      .login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService.success('¡Inicio de sesión exitoso!\n Redirigiendo...', {
            duration: 3000, // Duración en milisegundos
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          });
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/user_panel';
          setTimeout(() => this.router.navigateByUrl(returnUrl), 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err?.error?.message || err?.message || 'Credenciales inválidas o error inesperado.';
          this.notificationService.error(`Error al iniciar sesión: ${msg}`, {
            duration: 5000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}