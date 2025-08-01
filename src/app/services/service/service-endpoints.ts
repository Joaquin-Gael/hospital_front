export const SERVICE_ENDPOINTS = {
  GET_ALL: 'medic/services/',
  CREATE: 'medic/services/add/',
  UPDATE: (serviceId: string) => `medic/services/update/${serviceId}/`,
  DELETE: (serviceId: string) => `medic/services/delete/${serviceId}/`,
} as const;