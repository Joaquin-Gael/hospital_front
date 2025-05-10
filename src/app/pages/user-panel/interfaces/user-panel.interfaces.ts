export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  dni: string;
  telephone?: string;
  address?: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string; // ISO 8601, e.g., "2025-04-22T10:00:00"
  time: string; // e.g., "10:00"
  specialty: string; // e.g., "Cardiología"
  doctorName: string; // e.g., "Dr. Juan Pérez"
  location: string; // e.g., "Consultorio 3"
  status?: 'completed' | 'cancelled' | 'pending'; // Para HistoryComponent
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