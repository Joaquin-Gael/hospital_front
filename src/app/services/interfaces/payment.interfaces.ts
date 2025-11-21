export enum PaymentStatus {
  PENDING = 'pending',
  REQUIRES_ACTION = 'requires_action',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
  TRANSFER = 'transfer',
  PIX = 'pix',
  OTHER = 'other'
}

export interface PaymentItem {
  name: string;
  description?: string | null;
  quantity: number;
  unit_amount: number;
  currency?: string;
}

export interface PaymentRead {
  id: string;
  turn_id?: string;
  appointment_id?: string | null;
  user_id?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  payment_method?: PaymentMethod | null;
  payment_url?: string | null;
  provider?: string | null;
  external_id?: string | null;
  description?: string | null;
  receipt_url?: string | null;
  items?: PaymentItem[];
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentCreatePayload {
  turn_id: string;
  amount: number;
  currency: string;
  success_url: string;
  cancel_url: string;
  payment_method?: PaymentMethod;
  items?: PaymentItem[];
  metadata?: Record<string, unknown>;
}

export interface PaymentStatusUpdatePayload {
  status: PaymentStatus;
  payment_url?: string | null;
  metadata?: Record<string, unknown> | null;
}
