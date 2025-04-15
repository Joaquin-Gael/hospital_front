import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginObj: any = {
    "email": "",
    "password": ""
  };

  http = inject(HttpClient);
  router = inject(Router)

  onLogin() {
    debugger;
    this.http.post<{ access_token: string }>('http://127.0.0.1:8000/auth/login', this.loginObj).subscribe((response) => {
        console.log('¡Login exitoso!', response);
        localStorage.setItem('auth_token', response.access_token);
        this.router.navigateByUrl('user_panel')
      },
      (err) => {
        console.error('Error de la API:', JSON.stringify(err.error.detail, null, 2));
        alert('Algo salió mal, revisa el email o la contraseña');
      }
    );
  }
}

