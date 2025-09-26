export interface Notification {
  id: string;
  message: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date; // Cambiado a obligatorio
}
export interface Document {
  id: string;
  name: string;
  url: string;
  type: string; // e.g., "PDF"
  date: string; // ISO 8601, e.g., "2025-04-20T00:00:00"
  downloadUrl?: string; // URL opcional para descarga
}

export interface DniUploadFile {
  file: File;
  preview: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  data?: any;
}