import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { Auth } from '../../services/interfaces/hospital.interfaces';

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
  private readonly destroy$ = new Subject<void>();

  showPassword = false;
  isSubmitting = false;
  feedbackMessage: string | null = null;
  feedbackType: 'success' | 'error' | null = null;

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
    } else{
      this.router.navigateByUrl('/home');
    }
      
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  closeFeedback(): void {
    this.feedbackMessage = null;
    this.feedbackType = null;
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      this.feedbackMessage = 'Por favor completá correctamente el email y la contraseña.';
      this.feedbackType = 'error';
      return;
    }

    this.isSubmitting = true;
    this.feedbackMessage = null;

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
          this.feedbackMessage = '¡Inicio de sesión exitoso! Redirigiendo...';
          this.feedbackType = 'success';
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/user_panel';
          setTimeout(() => this.router.navigateByUrl(returnUrl), 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err?.error?.message || err?.message || 'Credenciales inválidas o error inesperado.';
          this.feedbackMessage = `Error al iniciar sesión: ${msg}`;
          this.feedbackType = 'error';
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
