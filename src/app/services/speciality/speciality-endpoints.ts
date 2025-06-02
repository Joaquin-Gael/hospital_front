export const SPECIALITY_ENDPOINTS = {
  GET_ALL: 'medic/specialities',
  ADD: 'medic/specialities/add',
  DELETE: (specialityId: string) => `medic/specialities/delete/${specialityId}/`,
  UPDATE: (specialityId: string) => `medic/specialities/update/${specialityId}/`,
} as const;