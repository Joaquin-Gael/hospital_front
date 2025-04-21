export interface Appointment {
  id: string;
  date: Date;
  time: string;
  specialty: string;
  doctorName: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  date: Date;
  downloadUrl?: string;
}

