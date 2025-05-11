import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user/user.service';
import { UserCreate } from '../../services/interfaces/user.interfaces';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthClass = '';

  registerForm: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: [RegisterComponent.passwordMatchValidator] }
  );

  static passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  generateUsername(firstName: string, lastName: string): string {
    const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

    // Longitud mínima
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 10;

    // Complejidad
    if (/[A-Z]/.test(password)) strength += 20; // Mayúsculas
    if (/[a-z]/.test(password)) strength += 10; // Minúsculas
    if (/[0-9]/.test(password)) strength += 20; // Números
    if (/[^A-Za-z0-9]/.test(password)) strength += 20; // Caracteres especiales

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
      alert('Por favor completá correctamente todos los campos.');
      return;
    }

    const { email, first_name, last_name, dni, password } = this.registerForm.value;
    const username = this.generateUsername(first_name, last_name);

    const payload: UserCreate = { email, username, first_name, last_name, dni, password };

    this.userService.createUser(payload).subscribe({
      next: () => {
        console.log('¡Registro exitoso!');
        alert('Te registraste con éxito. Iniciá sesión.');
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        console.error('Error en el registro:', err.message);
        alert('Algo salió mal: ' + (err.message || 'verificá tus datos.'));
      }
    });
  }
}