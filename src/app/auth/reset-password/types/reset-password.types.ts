export type ResetStep = 
  | 'method-selection' 
  | 'code-sent' 
  | 'code-verification' 
  | 'new-password' 
  | 'success';

export interface StepInfo {
  title: string;
  step: number;
  total: number;
}

export interface ProgressStep {
  id: number;
  label: string;
}

export interface UserProfile {
  email?: string;
  phone?: string | undefined;
  hasEmail: boolean;
  hasPhone: boolean;
}

export interface PasswordStrength {
  level: 'weak' | 'fair' | 'good' | 'strong';
  percentage: number;
  text: string;
}

export interface PasswordResetData {
  newPassword: string;
  closeOtherSessions: boolean;
}

export interface VerificationMethod {
  type: 'email' | 'phone';
  contact: string;
  masked: string;
}

export const RESET_FLOW_STEPS: ResetStep[] = [
  'method-selection',
  'code-sent', 
  'code-verification',
  'new-password',
  'success'
];

export const STEPS_INFO: Record<ResetStep, StepInfo> = {
  'method-selection': { title: 'Elige el método de verificación', step: 1, total: 4 },
  'code-sent': { title: 'Código enviado', step: 2, total: 4 },
  'code-verification': { title: 'Verifica el código', step: 2, total: 4 },
  'new-password': { title: 'Nueva contraseña', step: 3, total: 4 },
  'success': { title: 'Contraseña restablecida', step: 4, total: 4 }
};

export const PROGRESS_STEPS: ProgressStep[] = [
  { id: 1, label: 'Método' },
  { id: 2, label: 'Código' },
  { id: 3, label: 'Contraseña' },
  { id: 4, label: 'Confirmación' }
];

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
  sessionsClosed?: boolean;
}

export interface CodeResponse {
  message: string;
  success: boolean;
}

export interface VerifyResponse {
  message: string;
  success: boolean;
  valid: boolean;
}