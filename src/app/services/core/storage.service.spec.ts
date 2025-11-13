import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { LoggerService } from './logger.service';

describe('StorageService failure handling', () => {
  let service: StorageService;
  let logger: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', [
      'error',
      'warn',
      'info',
      'debug',
    ]);

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: LoggerService, useValue: logger },
      ],
    });

    service = TestBed.inject(StorageService);
    logger.warn.calls.reset();
  });

  it('returns false and logs a warning when localStorage.setItem throws', () => {
    const originalSetItem = spyOn(localStorage, 'setItem').and.callFake(() => {
      throw new Error('storage failure');
    });

    const result = service.setAccessToken('token');

    expect(result).toBeFalse();
    expect(logger.warn).toHaveBeenCalledWith(
      'setToken(access_token): Failed to access localStorage.',
      jasmine.any(Error)
    );

    originalSetItem.and.callThrough();
  });

  it('returns null and logs a warning when localStorage is unavailable', () => {
    const getStorageSpy = spyOn<any>(service, 'getStorage').and.returnValue(null);

    const token = service.getAccessToken();

    expect(token).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      'getToken(access_token): localStorage is unavailable.'
    );

    getStorageSpy.and.callThrough();
  });

  it('returns false and logs a warning when sessionStorage.removeItem throws', () => {
    const originalRemove = spyOn(sessionStorage, 'removeItem').and.callFake(() => {
      throw new Error('session failure');
    });

    const result = service.removeTempResetEmail();

    expect(result).toBeFalse();
    expect(logger.warn).toHaveBeenCalledWith(
      'removeTempResetEmail(): Failed to access sessionStorage.',
      jasmine.any(Error)
    );

    originalRemove.and.callThrough();
  });
});
