export const PAYMENTS_ENDPOINTS = {
  list: () => 'payments',
  detail: (paymentId: string) => `payments/${paymentId}`,
  create: () => 'payments',
  updateStatus: (paymentId: string) => `payments/${paymentId}/status`,
  delete: (paymentId: string) => `payments/${paymentId}`,
  recreateTurnSession: () => 'payments/turn',
  statusBySession: () => 'payments/status',
} as const;
