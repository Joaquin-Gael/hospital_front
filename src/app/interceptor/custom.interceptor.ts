import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { TokenUserResponse } from '../services/interfaces/user.interfaces';

// Lista de endpoints públicos que no requieren autenticación
const PUBLIC_ENDPOINTS = [
  '/users/add',
  '/auth/doc/login',
  '/id_prefix_api_secret/',
  'medic/chat/'
];

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  const router = inject(Router);
  const injector = inject(Injector);
  const isPublic = PUBLIC_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

  if (isPublic || !token) {
    return next(req);
  }

  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        const authService = injector.get(AuthService);
        return authService.refreshToken().pipe(
          switchMap((response: TokenUserResponse) => {
            const newClonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.access_token}` 
              }
            });
            return next(newClonedReq);
          }),
          catchError((refreshError) => {
            localStorage.removeItem('refresh_token');
            router.navigate(['/home']);
            console.error('Error al refrescar el token:', refreshError.message);
            return throwError(() => new Error('Sesión expirada, por favor iniciá sesión nuevamente.'));
          })
        );
      }
      
      console.error(`Error en la petición ${req.url}:`, error.message);
      return throwError(() => error);
    })
  );
};