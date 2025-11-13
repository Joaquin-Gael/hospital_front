import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { LoggerService } from '../services/core/logger.service';
import { StorageService } from '../services/core/storage.service';

const PUBLIC_ENDPOINTS = [
  '/users/add',
  '/auth/login',
  '/auth/doc/login',
  '/id_prefix_api_secret/',
  'medic/chat/',
];

const SENSITIVE_ENDPOINTS = ['/auth/refresh', '/auth/logout'];

let isRefreshing = false;

function readCookie(name: string): string | null {
  const value = `; ${document.cookie || ''}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function getCsrfTokenFromCookies(): string | null {
  const candidates = ['csrf_token', 'csrftoken', 'csrf'];
  for (const name of candidates) {
    const v = readCookie(name);
    if (v) return v;
  }
  return null;
}

function isEndpointMatch(url: string, endpoints: string[]): boolean {
  return endpoints.some(endpoint => url.endsWith(endpoint));
}

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const router = inject(Router);
  const authService = inject(AuthService);
  const storage = inject(StorageService);

  const isPublic = isEndpointMatch(req.url, PUBLIC_ENDPOINTS);
  const isSensitive = isEndpointMatch(req.url, SENSITIVE_ENDPOINTS);

  let headers = req.headers;

  // 🔐 Access token desde cookie (NO localStorage)
  const accessTokenFromCookie = authService.getAccessTokenFromCookie();
  if (accessTokenFromCookie && !isPublic && !isSensitive) {
    headers = headers.set('Authorization', `Bearer ${accessTokenFromCookie}`);
  }

  // 🛡️ CSRF solo para endpoints sensibles (refresh / logout)
  if (isSensitive) {
    const csrfToken = getCsrfTokenFromCookies();
    if (csrfToken) {
      headers = headers.set('X-CSRF-Token', csrfToken);
    } else {
      logger.debug('CSRF token not found in cookies for sensitive request', req.url);
    }
  }

  const clonedReq = req.clone({
    withCredentials: !isPublic,
    headers
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;

      // ⏳ Manejo de 401 con refresh basado en cookies
      if (status === 401 && !isPublic) {
        if (!isRefreshing) {
          isRefreshing = true;

          return authService.refreshToken().pipe(
            switchMap(() => {
              isRefreshing = false;

              const newToken = authService.getAccessTokenFromCookie();
              let newHeaders = req.headers;

              if (newToken) {
                newHeaders = newHeaders.set('Authorization', `Bearer ${newToken}`);
              }

              return next(
                req.clone({
                  withCredentials: true,
                  headers: newHeaders
                })
              );
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              storage.clearScopes();
              router.navigate(['/home']);
              logger.error('Error al refrescar el token:', refreshError);
              return throwError(
                () =>
                  new Error('Sesión expirada, por favor iniciá sesión nuevamente.')
              );
            })
          );
        } else {
          // Ya hay un refresh en curso: por ahora dejamos fallar esta request
          return throwError(() => error);
        }
      }

      logger.error(`Error en la petición ${req.url}:`, error.message);
      return throwError(() => error);
    })
  );
};
