import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { Auth } from '../../services/interfaces/hospital.interfaces';
import { NotificationService } from '../../core/notification/services/notification.service';
import { LoggerService } from '../../services/core/logger.service';
import { StorageService } from '../../services/core/storage.service';

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
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  showPassword = false;
  isSubmitting = false;

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false],
  });

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const returnUrl = urlParams.get('returnUrl');

    this.logger.debug('URL params:', { accessToken, returnUrl });

    if (accessToken) {
      this.logger.debug('Token encontrado en URL, procesando...');
      this.handleGoogleCallback(accessToken, returnUrl);
    } else {
      this.logger.debug('No se encontró access_token en la URL');
      const savedEmail = this.storage.getRememberEmail();
      if (!this.authService.isLoggedIn()) {
        if (savedEmail) {
          this.loginForm.patchValue({ email: savedEmail, remember: true });
        }
      } else {
        this.router.navigateByUrl('/home');
      }
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLoginGoogle(): void {
    this.logger.debug('Iniciando login con Google');
    this.authService.oauthLogin('google');
  }

  handleGoogleCallback(accessToken: string, returnUrl: string | null): void {
    this.logger.debug('Procesando callback con access_token:', accessToken);
    this.authService.storeAccessToken(accessToken).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.logger.debug('Inicio de sesión exitoso, isLoggedIn:', this.authService.isLoggedIn());
        if (returnUrl) {
          const decodedUrl = decodeURIComponent(returnUrl);
          this.logger.debug('Redirigiendo a:', decodedUrl);
          this.router.navigateByUrl(decodedUrl);
        } else {
          this.logger.debug('Redirigiendo a /user_panel');
          this.router.navigate(['/user_panel']);
        }
      },
      error: (error) => {
        this.logger.error('Error al almacenar el token:', error);
        this.notificationService.error('Error al procesar el inicio de sesión');
      },
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      this.notificationService.error(
        'Por favor completá correctamente el email y la contraseña.'
      );
      return;
    }

    this.isSubmitting = true;

    const { email, password, remember } = this.loginForm.value;
    const sanitizedEmail = email.trim();

    if (remember) {
      this.storage.setRememberEmail(sanitizedEmail);
    } else {
      this.storage.removeRememberEmail();
    }

    const credentials: Auth = { email: sanitizedEmail, password };

    this.authService
      .login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService.success(
            '¡Inicio de sesión exitoso!\n Redirigiendo...',
            {
              duration: 3000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            }
          );
          const returnUrl =
            this.route.snapshot.queryParams['returnUrl'] || '/user_panel';
          setTimeout(() => this.router.navigateByUrl(returnUrl), 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg =
            err?.error?.message ||
            err?.message ||
            'Credenciales inválidas o error inesperado.';
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

  testStorage(): void {
    this.logger.debug('Probando almacenamiento');
    this.authService.storeAccessToken('test-token').pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.logger.debug('Test token almacenado, isLoggedIn:', this.authService.isLoggedIn()),
      error: (error) => this.logger.error('Error en test storage:', error),
    });
  }

  testNotification(): void {
    this.logger.debug('Probando notificación');
    this.notificationService.success('Test');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}