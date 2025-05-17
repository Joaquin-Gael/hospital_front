export const DOCTOR_ENDPOINTS = {
  GET_ALL: 'medic/doctors/',
  GET_BY_ID: (doctorId: string) => `medic/doctors/${doctorId}/`,
  GET_ME: 'medic/doctors/me/',
  CREATE: 'medic/doctors/add/',
  DELETE: (doctorId: string) => `medic/doctors/delete/${doctorId}/`,
  DELETE_SCHEDULE: (doctorId: string, scheduleId: string) => `medic/doctors/delete/${doctorId}/schedule/${scheduleId}/`,
  UPDATE: (doctorId: string) => `medic/doctors/update/${doctorId}/`,
  ADD_SCHEDULE: 'medic/doctors/add/schedule/',
  BAN: (doctorId: string) => `medic/doctors/ban/${doctorId}/`,
  UNBAN: (doctorId: string) => `medic/doctors/unban/${doctorId}/`,
};