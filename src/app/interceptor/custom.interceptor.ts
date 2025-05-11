import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { TokenUserResponse } from '../services/interfaces/user.interfaces';

// Lista de endpoints públicos que no requieren autenticación
const PUBLIC_ENDPOINTS = [
  '/users/add',
  '/id_prefix_api_secret/'
];

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  const router = inject(Router);
  const injector = inject(Injector);

  // Verificar si la petición es a un endpoint público
  const isPublic = PUBLIC_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

  // Si es público o no hay token, pasar la petición sin modificar
  if (isPublic || !token) {
    return next(req);
  }

  // Clonar la petición y agregar el header de autorización
  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Obtener AuthService de forma diferida
        const authService = injector.get(AuthService);
        return authService.refreshToken().pipe(
          switchMap((response: TokenUserResponse) => {
            // Nuevo token obtenido, reintentar la petición
            const newClonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.access_token}`
              }
            });
            return next(newClonedReq);
          }),
          catchError((refreshError) => {
            // Si el refresh falla, limpiar tokens y redirigir a login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            router.navigate(['/login']);
            console.error('Error al refrescar el token:', refreshError.message);
            return throwError(() => new Error('Sesión expirada, por favor iniciá sesión nuevamente.'));
          })
        );
      }
      // Propagar otros errores
      console.error(`Error en la petición ${req.url}:`, error.message);
      return throwError(() => error);
    })
  );
};