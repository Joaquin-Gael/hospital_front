import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { TokenUserResponse } from '../services/interfaces/user.interfaces';
import { LoggerService } from '../services/core/logger.service';
import { StorageService } from '../services/core/storage.service';

const PUBLIC_ENDPOINTS = [
  '/users/add',
  '/auth/doc/login',
  '/id_prefix_api_secret/',
  'medic/chat/',
  '/auth/refresh'
];

let isRefreshing = false
const refreshSubject = new BehaviorSubject<string | null>(null);

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const router = inject(Router);
  const storage = inject(StorageService)
  const injector = inject(Injector);
  const isPublic = PUBLIC_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

  const accessToken = storage.getAccessToken()
  const refreshToken = storage.getRefreshToken()
  

  if (isPublic || !accessToken) {
    return next(req);
  }

  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return next(clonedReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        const authService = injector.get(AuthService);
        if (!isRefreshing){
          isRefreshing = true;
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
              isRefreshing = false
              storage.removeTokens()
              router.navigate(['/home']);
              console.error('Error al refrescar el token:', refreshError.message);
              return throwError(() => new Error('Sesión expirada, por favor iniciá sesión nuevamente.'));
            })
          );
        }
      } else {
        return refreshSubject.pipe(
          filter(token => token!= null),
          take(1),
          switchMap((newToken) => {
            const newClonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}`}
            });
            return next(newClonedReq)
          })
        )
      }
      
      logger.error(`Error en la petición ${req.url}:`, error.message);
      return throwError(() => error);
    })
  );
};