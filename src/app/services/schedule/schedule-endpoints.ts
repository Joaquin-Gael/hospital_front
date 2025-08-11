export const SCHEDULE_ENDPOINTS = {
  GET_ALL: 'medic/schedules/',
  ADD: 'medic/schedules/add',
  GET_DAYS: (specialtyId: string) => `medic/schedules/available/days/{speciality_id}`,
  DELETE: (scheduleId: string) => `medic/schedules/delete/${scheduleId}`,
  ADD_DOCTOR: 'medic/schedules/add/doctor',
  UPDATE: 'medic/schedules/update',
} as const;