export const USER_ENDPOINTS = {
  USERS: 'users',
  USER_BY_ID: (userId: string) => `users/${userId}`,
  ADD: 'users/add/',
  UPDATE: (userId: string) => `users/update/${userId}`,
  DELETE: (userId: string) => `users/delete/${userId}`,
  BAN: (userId: string) => `users/ban/${userId}`,
  UNBAN: (userId: string) => `users/unban/${userId}`,
  RECOVER_PASSWORD: 'users/update/petition/password',
  VERIFY_DNI: 'users/verify/dni',
  VERIFY_CODE: 'usersupdate/verify/code',
  UPDATE_PASSWORD: 'users/update/confirm/password',
} as const;