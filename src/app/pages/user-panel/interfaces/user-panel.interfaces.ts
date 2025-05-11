export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  dni: string;
  telephone?: string;
  address?: string;
}

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