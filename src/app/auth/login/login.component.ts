import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";
import { Router } from '@angular/router';
import { AuthService } from '../../auth/service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginObj: any = {
    "email": "",
    "password": ""
  };

  showPassword: boolean = false; 

  togglePassword(): void {
    this.showPassword = !this.showPassword; 
  }

  constructor(private authService: AuthService, private router: Router) { }

  onLogin() {
    debugger;
    this.authService.login(this.loginObj).subscribe({
      next: (response) => {
        this.authService.setUser(response);
        this.router.navigate(['/user_panel']);
      },
      error: (error) => console.error('Login error:', error, JSON.stringify(error.error.detail, null, 2)),
    });
  }
}

