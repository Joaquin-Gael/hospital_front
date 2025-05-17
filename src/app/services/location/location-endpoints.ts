export const LOCATION_ENDPOINTS = {
  GET_ALL: 'medic/locations',
  ADD: 'medic/locations/add',
  DELETE: (locationId: string) => `medic/locations/delete/${locationId}`,
  UPDATE: (locationId: string) => `medic/locations/update/${locationId}`,
} as const;