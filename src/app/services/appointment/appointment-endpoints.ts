export const APPOINTMENT_ENDPOINTS = {
  GET_APPOINTMENTS: 'medic/appointments',
  CREATE_TURN: 'medic/turns/add',
  DELETE_TURN: (turnId: number) => `medic/turns/delete/${turnId}`,
} as const;