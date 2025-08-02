export const AUTH_ENDPOINTS = {
  LOGIN: 'auth/login',
  OAUTH_LOGIN: (service: string) => `/oauth/${service}/`,
  DOC_LOGIN: 'auth/doc/login',
  DECODE: '/auth/decode/',
  REFRESH: 'auth/refresh',
  LOGOUT: 'auth/logout',
  SCOPES: 'auth/scopes',
  ME: 'users/me',
} as const;