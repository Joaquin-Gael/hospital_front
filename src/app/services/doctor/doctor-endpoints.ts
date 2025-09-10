export const DOCTOR_ENDPOINTS = {
  GET_ALL: 'medic/doctors/',
  GET_BY_ID: (doctorId: string) => `medic/doctors/${doctorId}/`,
  GET_ME: 'medic/doctors/me',
  GET_PATIENTS: (doctorId: string) => `medic/doctors/${doctorId}/patients`,
  GET_STATS: (doctorId: string) => `medic/doctors/${doctorId}/stats`, 
  CREATE: 'medic/doctors/add/',
  DELETE: (doctorId: string) => `medic/doctors/delete/${doctorId}/`,
  DELETE_SCHEDULE: (doctorId: string, scheduleId: string) => `medic/doctors/delete/${doctorId}/schedule/${scheduleId}/`,
  UPDATE: (doctorId: string) => `medic/doctors/update/${doctorId}/`, // General update
  UPDATE_SPECIALITY: (doctorId: string) => `medic/doctors/update/${doctorId}/speciality`, // Specific endpoint for speciality
  UPDATE_PASSWORD: (doctorId: string) => `medic/doctors/update/${doctorId}/password`, // Specific endpoint for password
  ADD_SCHEDULE: 'medic/doctors/add/schedule/',
  BAN: (doctorId: string) => `medic/doctors/ban/${doctorId}/`,
  UNBAN: (doctorId: string) => `medic/doctors/unban/${doctorId}/`,
};