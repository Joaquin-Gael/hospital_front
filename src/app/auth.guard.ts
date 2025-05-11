import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth/auth.service';

// Guard funcional para proteger rutas autenticadas
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    console.log('authGuard: Usuario autenticado, acceso permitido');
    return true;
  }

  console.log('authGuard: No autenticado, redirigiendo a /login');
  // Guardar la URL original para redirigir después del login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};