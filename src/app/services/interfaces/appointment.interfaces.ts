import { UserRead } from './user.interfaces';
import { Doctor } from './doctor.interfaces';
import { Service } from './hospital.interfaces';

// Estado del turno o cita
export enum TurnState {
  WAITING = 'waiting',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted'
}//

// creacion de turno
export interface TurnCreate {
  reason: string;
  state: TurnState.WAITING; // Siempre 'waiting' para creación
  date: string; // ISO 8601, e.g., "2025-08-14"
  time: string; // e.g., "10:00"
  date_created: string; // ISO 8601, e.g., "2025-08-14"
  user_id: string; // UUID
  services: string[]; // Array de UUIDs
  health_insurance: string | null; // UUID o null
}

// respuesta de turno
export interface TurnResponse {
  id: string;
  reason: string;
  state: TurnState;
  date: string; // ISO 8601
  time: string;
  date_created: string; // ISO 8601
  date_limit: string; // ISO 8601
  user_id: string;
  doctor_id: string;
  services: string[];
  appointment_id: string | null;
  user?: UserRead;
  doctor?: Doctor;
  service?: Service[];
}

export interface PayTurnResponse {
  turn: TurnResponse;
  payment_url: string;
}

export interface Turn {
  id: string;
  reason: string;
  state: TurnState;
  time: string;
  date: string; // ISO 8601
  date_limit: string; // ISO 8601
  date_created: string; // ISO 8601
  user_id: string;
  doctor_id: string;
  appointment_id: string | null;
  service_id: string;
  user?: UserRead;
  doctor?: Doctor;
  service?: Service[];
  appointment?: AppointmentMinimal;
}

export interface UpdateTurnState {
  new_state: string; // 'accepted', 'rejected', 'cancelled', 'finished'
}

// Modelo para eliminación de turno
export interface TurnDelete {
  id: string;
  message: string;
}

// Modelo de Cita completa (para MÉDICOS)
export interface Appointment {
  id: string;
  reason: string;
  state: TurnState;
  date: string; // ISO 8601
  date_created: string; // ISO 8601
  date_limit: string; // ISO 8601
  time: string;
  user_id: string;
  doctor_id: string;
  service_id: string;
  appointment_id: string;
  user: UserRead;
  doctor: Doctor;
  service: Service;
  turn?: Turn;
}

// Cita mínima para romper ciclos
export interface AppointmentMinimal {
  id: string;
  date: string;
  state: TurnState;
  doctor_id: string;
  service_id: string;
}

// Vista simplificada para mostrar citas
export interface AppointmentViewModel {
  id: string;
  turnId: string;
  date: string;
  time: string;
  specialty: string;
  doctorName: string;
  state: TurnState;
}