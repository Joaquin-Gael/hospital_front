import { UserRead } from './user.interfaces';
import { Doctor } from './doctor.interfaces';
import { Service } from './hospital.interfaces';
import { PaymentMethod, PaymentRead, PaymentStatus } from './payment.interfaces';

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
  date_limit: string | null; // ISO 8601 o null cuando no aplica
  user_id: string;
  doctor_id: string | null;
  services: string[]; // Array de UUIDs devueltos por el backend
  health_insurance: string | null;
  appointment_id: string | null;
  user?: UserRead | null;
  doctor?: Doctor | null;
  service?: Service[];
  services_details?: Service[];
  appointment?: AppointmentMinimal;
}

export interface TurnRescheduleRequest {
  date: string; // ISO 8601, e.g., "2025-08-14"
  time: string; // HH:mm:ss
  reason?: string | null;
}

export interface RescheduleTurnDialogData {
  currentDate?: string;
  currentTime?: string;
  specialtyId?: string;
}

export interface TurnRescheduleResponse {
  message: string;
  turn: TurnResponse;
}

export interface TurnPaymentResponse {
  turn: TurnResponse;
  payment: PaymentRead | null;
  payment_url: string | null;
}

export enum TurnPaymentErrorType {
  SLOT_UNAVAILABLE = 'slot_unavailable',
  APPOINTMENT_CONFLICT = 'appointment_conflict',
  OUT_OF_SCHEDULE = 'out_of_schedule',
  UNKNOWN = 'unknown'
}

export interface TurnPaymentError {
  success: false;
  type: TurnPaymentErrorType;
  message: string;
  status?: number;
}

export interface TurnPaymentSuccess extends TurnPaymentResponse {
  success: true;
}

export type TurnPaymentResult = TurnPaymentSuccess | TurnPaymentError;

export const isTurnPaymentError = (
  value: unknown
): value is TurnPaymentError =>
  typeof value === 'object' &&
  value !== null &&
  'success' in value &&
  (value as { success?: unknown }).success === false &&
  'type' in value;

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
  health_insurance: string | null;
  user?: UserRead;
  doctor?: Doctor;
  service?: Service[];
  appointment?: AppointmentMinimal;
  payment?: PaymentRead | null;
  payment_url?: string | null;
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
  paymentStatus: PaymentStatus | null;
  paymentUrl: string | null;
  paymentMethod: PaymentMethod | string | null;
  paymentMetadata: Record<string, unknown> | null;
  paymentMetadataEntries: { label: string; value: string }[];
}