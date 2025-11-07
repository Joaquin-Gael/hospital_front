import { PayTurnResponse } from './appointment.interfaces';

export interface CashesRead {
  id: string;
  turn_id: string;
  user_id: string;
  status: string;
  amount: number;
  currency: string;
  payment_url?: string | null;
  payment_intent?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface CashesDetailsRead extends CashesRead {
  appointment_id?: string | null;
  description?: string | null;
  receipt_url?: string | null;
  payment_method_types?: string[] | null;
  raw_response?: Record<string, unknown> | null;
}

export interface CashesPaymentSuccessPayload {
  paymentIntent?: string;
  paymentIntentClientSecret?: string;
  redirectStatus?: string;
  sessionId?: string;
  cashId?: string;
  turnId?: string;
  appointmentId?: string;
  metadata?: Record<string, unknown>;
  rawParams: Record<string, string>;
}

export interface CashesPaymentCancelPayload {
  paymentIntent?: string;
  cashId?: string;
  turnId?: string;
  redirectStatus?: string;
  rawParams: Record<string, string>;
}

export interface PayTurnWithCashResponse extends PayTurnResponse {
  cash?: CashesRead | null;
  cash_detail?: CashesDetailsRead | null;
}
