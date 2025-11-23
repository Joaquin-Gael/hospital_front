export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
  TRANSFER = 'transfer'
}

export interface PaymentItem {
  id: string;
  service_id?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit_amount: number;
  total_amount: number;
}

export interface Payment {
  id: string;
  turn_id?: string | null;
  appointment_id?: string | null;
  user_id?: string | null;
  status: PaymentStatus;
  amount_total: number;
  currency: string;
  payment_method?: PaymentMethod | null;
  payment_url?: string | null;
  provider?: string | null;
  external_id?: string | null;
  gateway_session_id?: string | null;
  description?: string | null;
  receipt_url?: string | null;
  items: PaymentItem[];
  metadata?: Record<string, unknown> | null;
  gateway_metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type PaymentRead = Payment;

export interface PaymentCreatePayload {
  turn_id: string;
  amount_total: number;
  currency: string;
  success_url: string;
  cancel_url: string;
  payment_method?: PaymentMethod;
  items: PaymentItem[];
  metadata?: Record<string, unknown>;
  gateway_metadata?: Record<string, unknown>;
}

export interface PaymentStatusUpdatePayload {
  status: PaymentStatus;
  payment_url?: string | null;
  metadata?: Record<string, unknown> | null;
  gateway_metadata?: Record<string, unknown> | null;
}
