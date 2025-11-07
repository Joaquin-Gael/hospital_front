export const CASHES_ENDPOINTS = {
  list: () => 'cashes',
  detail: (cashId: string) => `cashes/${cashId}`,
  create: () => 'cashes',
  update: (cashId: string) => `cashes/${cashId}`,
  /**
   * Static helpers documenting the callback routes that Stripe redirects to.
   * They are not invoked through the ApiService because Stripe hits them directly.
   */
  success: () => '/cashes/pay/success',
  cancel: () => '/cashes/pay/cancel',
} as const;
