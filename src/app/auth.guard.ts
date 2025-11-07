import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { LoggerService } from './services/core/logger.service';

// Guard funcional para proteger rutas autenticadas
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  const returnUrl = route.queryParamMap.get('returnUrl') ?? state.url;

  if (authService.isLoggedIn()) {
    logger.debug('authGuard: Usuario autenticado, acceso permitido', {
      attemptedUrl: state.url,
    });
    return true;
  }

  logger.info('authGuard: No autenticado, redirigiendo a /login', {
    attemptedUrl: state.url,
    returnUrl,
  });
  // Guardar la URL original para redirigir después del login
  router.navigate(['/login'], { queryParams: { returnUrl } });
  return false;
};

