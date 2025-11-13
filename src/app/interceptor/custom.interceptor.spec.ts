import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { customInterceptor } from './custom.interceptor';
import { StorageService } from '../services/core/storage.service';
import { LoggerService } from '../services/core/logger.service';
import { AuthService } from '../services/auth/auth.service';
import { TokenUserResponse } from '../services/interfaces/user.interfaces';

class MockStorageService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  clearStorageCalls = 0;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): boolean {
    this.accessToken = token;
    return true;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setRefreshToken(token: string): boolean {
    this.refreshToken = token;
    return true;
  }

  removeTokens(): boolean {
    this.accessToken = null;
    this.refreshToken = null;
    return true;
  }

  clearStorage(): boolean {
    this.clearStorageCalls += 1;
    this.removeTokens();
    return true;
  }

  setItem(): boolean { return true; }
  getItem(): string | null { return null; }
  removeItem(): boolean { return true; }
  setRememberEmail(): boolean { return true; }
  getRememberEmail(): string | null { return null; }
  removeRememberEmail(): boolean { return true; }
  setTempResetEmail(): boolean { return true; }
  getTempResetEmail(): string | null { return null; }
  removeTempResetEmail(): boolean { return true; }
  clearAllTempData(): boolean { return true; }
}

class MockLoggerService {
  error = jasmine.createSpy('error');
  warn = jasmine.createSpy('warn');
  info = jasmine.createSpy('info');
  debug = jasmine.createSpy('debug');
}

class MockRouter {
  navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
  url = '/';
  routerState = {
    snapshot: {
      url: '/',
    },
  };
}

const createTokenResponse = (accessToken: string, refreshToken: string): TokenUserResponse => ({
  token_type: 'bearer',
  access_token: accessToken,
  refresh_token: refreshToken,
  user: {
    id: '1',
    is_active: true,
    is_admin: false,
    is_superuser: false,
    last_login: null,
    date_joined: '2023-01-01T00:00:00Z',
    username: 'test-user',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    dni: null,
    address: null,
    telephone: null,
    blood_type: null,
    health_insurance: [],
    img_profile: null,
  },
});

class MockAuthService {
  refreshCallCount = 0;
  refreshHandler: () => Observable<TokenUserResponse> = () => of(createTokenResponse('new-access', 'new-refresh'));

  refreshToken() {
    this.refreshCallCount += 1;
    return this.refreshHandler();
  }
}

describe('customInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuth: MockAuthService;
  let mockStorage: MockStorageService;
  let mockRouter: MockRouter;
  let mockLogger: MockLoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([customInterceptor])),
        provideHttpClientTesting(),
        { provide: StorageService, useClass: MockStorageService },
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    mockAuth = TestBed.inject(AuthService) as unknown as MockAuthService;
    mockStorage = TestBed.inject(StorageService) as MockStorageService;
    mockRouter = TestBed.inject(Router) as unknown as MockRouter;
    mockLogger = TestBed.inject(LoggerService) as unknown as MockLoggerService;

    mockStorage.setAccessToken('old-access');
    mockStorage.setRefreshToken('refresh-token');
    mockRouter.url = '/dashboard';
    mockRouter.routerState.snapshot.url = '/dashboard';
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('refreshes the token and retries queued requests when refresh succeeds', () => {
    const responses: Array<{ source: string }> = [];

    mockAuth.refreshHandler = () => {
      mockStorage.setAccessToken('new-access');
      return of(createTokenResponse('new-access', 'new-refresh'));
    };

    http.get('/secure-resource').subscribe((response) => responses.push(response as { source: string }));
    http.get('/other-resource').subscribe((response) => responses.push(response as { source: string }));

    const firstRequest = httpMock.expectOne('/secure-resource');
    expect(firstRequest.request.headers.get('Authorization')).toBe('Bearer old-access');
    firstRequest.flush(null, { status: 401, statusText: 'Unauthorized' });

    const secondRequest = httpMock.expectOne('/other-resource');
    expect(secondRequest.request.headers.get('Authorization')).toBe('Bearer old-access');
    secondRequest.flush(null, { status: 401, statusText: 'Unauthorized' });

    const retriedRequests = httpMock.match((req) => req.url === '/secure-resource' || req.url === '/other-resource');
    expect(retriedRequests.length).toBe(2);
    retriedRequests.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer new-access');
    });

    const retriedSecure = retriedRequests.find((request) => request.request.url === '/secure-resource');
    const retriedOther = retriedRequests.find((request) => request.request.url === '/other-resource');

    if (!retriedSecure || !retriedOther) {
      fail('Expected retried requests for both endpoints');
      return;
    }

    retriedSecure.flush({ source: 'secure' });
    retriedOther.flush({ source: 'other' });

    expect(responses).toEqual([
      { source: 'secure' },
      { source: 'other' },
    ]);
    expect(mockAuth.refreshCallCount).toBe(1);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('clears tokens, redirects to login, and propagates the error when refresh fails', () => {
    mockRouter.url = '/current-route';
    mockRouter.routerState.snapshot.url = '/current-route';
    mockAuth.refreshHandler = () => throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request' })) as Observable<TokenUserResponse>;

    const receivedErrors: HttpErrorResponse[] = [];

    http.get('/secure-resource').subscribe({
      next: () => fail('Request should not succeed'),
      error: (error) => receivedErrors.push(error),
    });

    const failingRequest = httpMock.expectOne('/secure-resource');
    expect(failingRequest.request.headers.get('Authorization')).toBe('Bearer old-access');
    failingRequest.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(receivedErrors.length).toBe(1);
    expect(receivedErrors[0]).toBeInstanceOf(HttpErrorResponse);
    expect(receivedErrors[0].status).toBe(400);
    expect(mockAuth.refreshCallCount).toBe(1);
    expect(mockStorage.clearStorageCalls).toBe(1);
    expect(mockStorage.getAccessToken()).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/current-route' } });
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to refresh authentication token', jasmine.any(HttpErrorResponse));

    mockStorage.setAccessToken('old-access');
    mockAuth.refreshHandler = () => throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request' })) as Observable<TokenUserResponse>;

    http.get('/secure-resource').subscribe({
      next: () => fail('Request should not succeed'),
      error: () => {
        /* swallow error for test */
      },
    });

    const secondAttempt = httpMock.expectOne('/secure-resource');
    expect(secondAttempt.request.headers.get('Authorization')).toBe('Bearer old-access');
    secondAttempt.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(mockAuth.refreshCallCount).toBe(2);
  });
});
