export interface Appointment {
  id: number;
  user_id: number;
  doctor_id: string; // UUID
  turn_id: number;
  service_id: string; // UUID
  date: string; // ISO 8601, e.g., "2025-04-22T10:00:00"
  date_created: string; // ISO 8601
  date_limit: string; // ISO 8601
  state: TurnState;
}

export interface Turn {
  id: number;
  reason: string;
  state: TurnState;
  date: string; // ISO 8601
  date_limit: string; // ISO 8601
  date_created: string; // ISO 8601
  user_id: number;
  doctor_id: string; // UUID
  appointment_id: number;
  service_id: string; // UUID
}

export interface TurnCreate {
  reason: string;
  state: TurnState;
  date: string; // ISO 8601
  date_limit: string; // ISO 8601
  doctor_id: string; // UUID
  appointment_id?: number;
  service_id: string; // UUID
}

export interface TurnDelete {
  id: number;
  message: string;
}

export enum TurnState {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface AppointmentViewModel {
  id: number;
  turnId: number;
  date: string;
  time: string;
  specialty: string;
  doctorName: string;
  location: string;
  state: TurnState;
}