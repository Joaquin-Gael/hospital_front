export const APPOINTMENT_ENDPOINTS = {
  GET_APPOINTMENTS: 'medic/appointments',
  GET_TURNS: 'medic/turns/',
  GET_BY_ID: (userId: string) => `medic/turns/${userId}`,
  GET_TURN: (turnId: string) => `medic/turns/${turnId}`,
  CREATE_TURN: 'medic/turns/add',
  DELETE_TURN: (turnId: string) => `medic/turns/delete/${turnId}`,
} as const;