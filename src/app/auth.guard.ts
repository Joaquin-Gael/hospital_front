import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth/service/auth.service';

// Define el Guard como una función (estilo Angular 17+)
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Inyecta el servicio de autenticación
  const router = inject(Router); // Inyecta el router para redirigir

  if (authService.isLoggedIn()) {
    return true; 
  } else {
    router.navigate(['/login']);
    return false;
  }
};