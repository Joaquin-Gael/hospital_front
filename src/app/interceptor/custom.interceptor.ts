import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/service/auth.service';

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  const router = inject(Router);
  const injector = inject(Injector); // Inyectar Injector

  const publicEndpoints = [
    '/users/add',
    '/id_prefix_api_secret/',
  ];

  const isPublic = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (isPublic || !token) {
    return next(req);
  }

  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(clonedReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Obtener AuthService de forma diferida
        const authService = injector.get(AuthService);
        return authService.refreshToken().pipe(
          switchMap((response) => {
            // Nuevo token obtenido, reintentar la petición
            const newClonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.access_token}`,
              },
            });
            return next(newClonedReq);
          }),
          catchError(() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};