import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { UserAuth } from '../../services/interfaces/user.interfaces';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false]
  });

  showPassword: boolean = false;

  ngOnInit(): void {
    // Cargar email guardado si existe
    const savedEmail = localStorage.getItem('rememberEmail');
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
      alert('Por favor completá correctamente el email y la contraseña.');
      return;
    }

    const { email, password, remember } = this.loginForm.value;

    if (remember) {
      localStorage.setItem('rememberEmail', email);
    } else {
      localStorage.removeItem('rememberEmail');
    }

    const credentials: UserAuth = { email, password };

    this.authService.login(credentials).subscribe({
      next: () => {
        console.log('¡Login exitoso!');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/user_panel';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        console.error('Error en el login:', err.message);
        alert('Error al iniciar sesión: ' + (err.message || 'verificá tus credenciales.'));
      }
    });
  }
}