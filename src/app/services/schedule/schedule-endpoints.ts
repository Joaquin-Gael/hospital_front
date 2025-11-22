import { MedicalScheduleDaysRequest } from '../interfaces/hospital.interfaces';

export const SCHEDULE_ENDPOINTS = {
  GET_ALL: 'medic/schedules/',
  ADD: 'medic/schedules/add',
  GET_DAYS: ({ specialtyId }: MedicalScheduleDaysRequest) =>
    `medic/schedules/available/days/${specialtyId}`,
  DELETE: (scheduleId: string) => `medic/schedules/delete/${scheduleId}`,
  ADD_DOCTOR: 'medic/schedules/add/doctor',
  UPDATE: 'medic/schedules/update',
} as const;