export const LOCATION_ENDPOINTS = {
  GET_ALL: 'locations',
  ADD: 'locations/add',
  DELETE: (locationId: number) => `locations/delete/${locationId}`,
  UPDATE: (locationId: number) => `locations/update/${locationId}`,
} as const;