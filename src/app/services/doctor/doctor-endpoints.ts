export const DOCTOR_ENDPOINTS = {
  GET_ALL: '/doctors/',
  GET_BY_ID: (doctorId: string) => `/doctors/${doctorId}/`,
  GET_ME: '/doctors/me/',
  CREATE: '/doctors/add/',
  DELETE: (doctorId: string) => `/doctors/delete/${doctorId}/`,
  DELETE_SCHEDULE: (doctorId: string, scheduleId: string) => `/doctors/delete/${doctorId}/schedule/${scheduleId}/`,
  UPDATE: (doctorId: string) => `/doctors/update/${doctorId}/`,
  ADD_SCHEDULE: '/doctors/add/schedule/',
  BAN: (doctorId: string) => `/doctors/ban/${doctorId}/`,
  UNBAN: (doctorId: string) => `/doctors/unban/${doctorId}/`,
};