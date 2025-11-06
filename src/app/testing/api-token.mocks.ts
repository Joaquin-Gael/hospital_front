import { Provider } from '@angular/core';
import { API_BASE_URL, API_WS_BASE_URL } from '../services/core/api.tokens';

export const API_TOKEN_MOCKS: Provider[] = [
  { provide: API_BASE_URL, useValue: 'http://127.0.0.1:8000' },
  { provide: API_WS_BASE_URL, useValue: 'ws://127.0.0.1:8000' },
];
