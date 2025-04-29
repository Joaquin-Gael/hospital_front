import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  const router = inject(Router);

  const publicEndpoints = [
    '/users/add',
    '/auth/login',
    '/id_prefix_api_secret/',
  ];

  const isPublic = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (isPublic || !token) {
    return next(req);
  }

  // Clona la petición y añade el header de Authorization
  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(clonedReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('auth_token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};