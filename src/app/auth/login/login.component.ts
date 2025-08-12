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
    const fullReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.logger.debug('returnUrl completo recibido:', fullReturnUrl);

    if (fullReturnUrl?.includes('a=')) {
      try {
        const query = new URLSearchParams(fullReturnUrl.split('?')[1]);
        const codeSecret = query.get('a');

        this.logger.debug('Código secreto extraído (raw):', codeSecret);

        if (!codeSecret || codeSecret.trim() === '') {
          this.logger.warn('El código secreto está vacío o mal formado.');
          return;
        }

        // 🔍 Aquí se manda al backend
        this.authService.decode(codeSecret).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.logger.debug('Token decodificado exitosamente');
            const redirectTo = decodeURIComponent(fullReturnUrl.split('?')[0]);
            this.router.navigateByUrl(redirectTo || '/user_panel');
          },
          error: (err) => {
            this.logger.error('Error al decodificar el token:', err);
            this.notificationService.error(
              'Error al procesar el inicio de sesión con Google'
            );
          },
        });

        return; // Salimos del método, no seguimos con login manual
      } catch (e) {
        this.logger.error('Error al extraer el código secreto:', e);
      }
    }

    const savedEmail = this.storage.getRememberEmail();
    if (!this.authService.isLoggedIn() && savedEmail) {
      this.loginForm.patchValue({ email: savedEmail, remember: true });
    } else if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl('/home');
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLoginGoogle(): void {
    this.logger.debug('Iniciando login con Google');
    this.authService.oauthLogin('google');
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
              duration: 5000,
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
          this.logger.error('Error al iniciar sesión:', err);
          this.notificationService.error('Error al iniciar sesión, por favor, intenta nuevamente.', {
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
