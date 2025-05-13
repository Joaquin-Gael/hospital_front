export const SCHEDULE_ENDPOINTS = {
  GET_ALL: 'schedules',
  ADD: 'schedules/add',
  DELETE: (scheduleId: string) => `schedules/delete/${scheduleId}`,
  ADD_DOCTOR: 'schedules/add/doctor',
  UPDATE: 'schedules/update',
} as const;