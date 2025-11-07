import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './services/auth/auth.service';
import { LoggerService } from './services/core/logger.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let logger: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']),
        },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        {
          provide: LoggerService,
          useValue: jasmine.createSpyObj<LoggerService>('LoggerService', ['debug', 'info']),
        },
      ],
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  const createState = (url: string): RouterStateSnapshot => ({
    url,
    root: {} as ActivatedRouteSnapshot,
    toString: () => url,
  });

  it('allows navigation when logged in and logs debug information', () => {
    authService.isLoggedIn.and.returnValue(true);
    const route = { queryParamMap: convertToParamMap({}) } as ActivatedRouteSnapshot;
    const state = createState('/dashboard');

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBeTrue();
    expect(logger.debug).toHaveBeenCalledWith(
      'authGuard: Usuario autenticado, acceso permitido',
      jasmine.objectContaining({ attemptedUrl: '/dashboard' })
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects to login preserving existing returnUrl and logs info', () => {
    authService.isLoggedIn.and.returnValue(false);
    const route = {
      queryParamMap: convertToParamMap({ returnUrl: '/custom-destination' }),
    } as ActivatedRouteSnapshot;
    const state = createState('/admin/secret');

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBeFalse();
    expect(logger.info).toHaveBeenCalledWith(
      'authGuard: No autenticado, redirigiendo a /login',
      jasmine.objectContaining({ attemptedUrl: '/admin/secret', returnUrl: '/custom-destination' })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/custom-destination' },
    });
  });

  it('redirects to login using attempted url when no returnUrl provided', () => {
    authService.isLoggedIn.and.returnValue(false);
    const route = { queryParamMap: convertToParamMap({}) } as ActivatedRouteSnapshot;
    const state = createState('/secure');

    TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(logger.info).toHaveBeenCalledWith(
      'authGuard: No autenticado, redirigiendo a /login',
      jasmine.objectContaining({ attemptedUrl: '/secure', returnUrl: '/secure' })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/secure' },
    });
  });
});
