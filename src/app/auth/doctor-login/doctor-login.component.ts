import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AuthService } from '../../services/auth/auth.service';
import { LoggerService } from '../../services/core/logger.service';
import { StorageService } from '../../services/core/storage.service';
import { Auth } from '../../services/interfaces/hospital.interfaces';

@Component({
  selector: 'app-doctor-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './doctor-login.component.html',
  styleUrls: ['./doctor-login.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate('300ms ease-in', style({ opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-out', style({ opacity: 0 }))]),
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
    trigger('buttonState', [
      state('idle', style({ backgroundColor: 'var(--primary-color)' })),
      state('loading', style({ backgroundColor: 'var(--primary-color-light)' })),
      transition('idle <=> loading', animate('300ms ease-in-out')),
    ]),
  ],
})
export class DoctorLoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [false],
  });

  showPassword: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;

  ngOnInit(): void {
    const savedEmail = this.storage.getRememberEmail();
    if (savedEmail) {
      this.loginForm.patchValue({ email: savedEmail, remember: true });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.error = 'Por favor completá correctamente el email y la contraseña.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const { email, password, remember } = this.loginForm.value;

    if (remember) {
      this.storage.setRememberEmail(email);
    } else {
      this.storage.removeRememberEmail();
    }

    const credentials: Auth = { email, password };

    this.authService.doctorLogin(credentials).subscribe({
      next: () => {
        this.logger.info('Doctor login successful');
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/medic_panel/home';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.logger.error('Doctor login failed', err);
        this.isLoading = false;
        this.error = err.message || 'Verificá tus credenciales.';
      },
    });
  }
}