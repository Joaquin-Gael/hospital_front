export const SPECIALITY_ENDPOINTS = {
  GET_ALL: 'specialities',
  ADD: 'specialities/add',
  DELETE: (specialityId: number) => `specialities/delete/${specialityId}`,
  UPDATE: (specialityId: number) => `specialities/update/${specialityId}`,
} as const;