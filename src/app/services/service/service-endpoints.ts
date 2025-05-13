export const SERVICE_ENDPOINTS = {
  GET_ALL: 'services',
  CREATE: 'services/add',
  UPDATE: (serviceId: string) => `services/update/${serviceId}`,
  DELETE: (serviceId: string) => `services/delete/${serviceId}`,
} as const;