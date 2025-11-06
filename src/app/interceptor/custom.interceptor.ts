import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector, InjectionToken } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take, tap } from 'rxjs/operators';
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

class RefreshCoordinator {
  private refreshSubject = new BehaviorSubject<string | null>(null);
  private refreshing = false;

  start(): void {
    this.refreshing = true;
    this.refreshSubject.next(null);
  }

  publish(token: string): void {
    this.refreshSubject.next(token);
  }

  fail(error: HttpErrorResponse): void {
    if (!this.refreshSubject.closed) {
      this.refreshSubject.error(error);
    }
    this.refreshSubject = new BehaviorSubject<string | null>(null);
    this.refreshing = false;
  }

  finish(): void {
    this.refreshing = false;
  }

  isRefreshing(): boolean {
    return this.refreshing;
  }

  waitForToken() {
    return this.refreshSubject.pipe(
      filter((token): token is string => token !== null),
      take(1)
    );
  }
}

const REFRESH_COORDINATOR = new InjectionToken<RefreshCoordinator>('CUSTOM_INTERCEPTOR_REFRESH_COORDINATOR', {
  providedIn: 'root',
  factory: () => new RefreshCoordinator(),
});

const handleRefreshFailure = (
  refreshError: HttpErrorResponse,
  storage: StorageService,
  router: Router,
  logger: LoggerService
) => {
  const returnUrl = router.routerState.snapshot.url || router.url || '/';
  storage.clearStorage();
  logger.error('Failed to refresh authentication token', refreshError);
  router.navigate(['/login'], { queryParams: { returnUrl } });
};

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const router = inject(Router);
  const storage = inject(StorageService)
  const injector = inject(Injector);
  const refreshCoordinator = inject(REFRESH_COORDINATOR);
  const isPublic = PUBLIC_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

  const accessToken = storage.getAccessToken()


  if (isPublic || !accessToken) {
    return next(req);
  }

  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const authService = injector.get(AuthService);
        if (!refreshCoordinator.isRefreshing()){
          refreshCoordinator.start();
          return authService.refreshToken().pipe(
            tap((response: TokenUserResponse) => {
              refreshCoordinator.publish(response.access_token);
            }),
            switchMap((response: TokenUserResponse) => {
              const newClonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.access_token}`
                }
              });
              return next(newClonedReq);
            }),
            catchError((refreshError: HttpErrorResponse) => {
              refreshCoordinator.fail(refreshError);
              handleRefreshFailure(refreshError, storage, router, logger);
              return throwError(() => refreshError);
            }),
            finalize(() => {
              refreshCoordinator.finish();
            })
          );
        }

        return refreshCoordinator.waitForToken().pipe(
          switchMap((newToken) => {
            const newClonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}`}
            });
            return next(newClonedReq)
          })
        )
      }

      logger.error(`HTTP request to ${req.url} failed`, error);
      return throwError(() => error);
    })
  );
};