export interface PasswordStrength {
  level: 'weak' | 'fair' | 'good' | 'strong';
  percentage: number;
  text: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}