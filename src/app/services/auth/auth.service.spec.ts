import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from '../core/api.service';
import { StorageService } from '../core/storage.service';
import { LoggerService } from '../core/logger.service';
import { AUTH_ENDPOINTS } from './auth-endpoints';
import { TokenUserResponse } from '../interfaces/user.interfaces';
import { API_BASE_URL } from '../core/api.tokens';
import { Auth } from '../interfaces/hospital.interfaces';

describe('AuthService', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let storage: jasmine.SpyObj<StorageService>;
  let logger: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['post', 'get', 'delete']);
    storage = jasmine.createSpyObj<StorageService>(
      'StorageService',
      [
        'getAccessToken',
        'setAccessToken',
        'setRefreshToken',
        'getRefreshToken',
        'clearStorage',
        'setItem',
        'getItem',
      ]
    );
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', ['error', 'warn', 'info', 'debug']);

    storage.getAccessToken.and.returnValue(null);
    storage.getRefreshToken.and.returnValue('refresh-token');
    storage.setAccessToken.and.returnValue(true);
    storage.setRefreshToken.and.returnValue(true);
    storage.setItem.and.returnValue(true);
    storage.getItem.and.returnValue(null);
    storage.clearStorage.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiService },
        { provide: StorageService, useValue: storage },
        { provide: LoggerService, useValue: logger },
        { provide: API_BASE_URL, useValue: 'http://base.local' },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('returns the original login response even when scopes retrieval fails', () => {
    const service = TestBed.inject(AuthService);
    const credentials: Auth = { email: 'user@example.com', password: 'password' };
    const tokenResponse: TokenUserResponse = {
      access_token: 'access',
      refresh_token: 'refresh',
      token_type: 'bearer',
      user: {
        id: '1',
        is_active: true,
        is_admin: false,
        is_superuser: false,
        last_login: null,
        date_joined: '2023-01-01T00:00:00Z',
        username: 'user',
        email: 'user@example.com',
        first_name: 'User',
        last_name: 'Example',
        dni: null,
        address: null,
        telephone: null,
        blood_type: null,
        health_insurance: [],
        img_profile: null,
      },
    };

    apiService.post.and.returnValue(of(tokenResponse));
    apiService.get.and.returnValue(throwError(() => new Error('scopes failed')));

    const responses: TokenUserResponse[] = [];

    service.login(credentials).subscribe({
      next: (response) => responses.push(response),
      error: fail,
    });

    expect(apiService.get).toHaveBeenCalledWith(AUTH_ENDPOINTS.SCOPES);
    expect(storage.setItem).toHaveBeenCalledWith('scopes', JSON.stringify([]));
    expect(responses).toEqual([tokenResponse]);
  });

  it('clears the session when login receives an unauthorized error', () => {
    storage.getAccessToken.and.returnValue('existing-token');
    const service = TestBed.inject(AuthService);
    const statusChanges: boolean[] = [];
    service.loginStatus$.subscribe((status) => statusChanges.push(status));

    const httpError = new HttpErrorResponse({
      status: 401,
      error: { detail: 'Invalid credentials' },
    });

    apiService.post.and.returnValue(throwError(() => httpError));

    const credentials: Auth = { email: 'user@example.com', password: 'password' };

    let receivedError: Error | undefined;
    service.login(credentials).subscribe({
      next: fail,
      error: (error) => (receivedError = error as Error),
    });

    expect(receivedError?.message).toBe('Invalid credentials');
    expect(storage.clearStorage).toHaveBeenCalled();
    expect(statusChanges).toEqual([true, false]);
  });
});
