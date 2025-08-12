import { UserRead } from './user.interfaces';
import { Doctor } from './doctor.interfaces';
import { Service } from './hospital.interfaces';

// Estado del turno o cita
export enum TurnState {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  WAITING = 'waiting'
}

// Modelo de Turno completo (para PACIENTES)
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
  appointment_id: string;
  service_id: string;

  user?: UserRead;
  doctor?: Doctor;
  service?: Service;
  appointment?: AppointmentMinimal; // Evita recursividad completa
}

// Modelo para creación de turno
export interface TurnCreate {
  reason: string;
  state: TurnState;
  date: string;
  date_limit: string;
  time: string;
  doctor_id: string;
  appointment_id?: string;
  service_id: string;
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


export interface AppointmentViewModel {
  id: string;
  turnId: string;
  date: string; 
  time: string; 
  specialty: string;
  doctorName: string;
  location: string;
  state: TurnState;
}
