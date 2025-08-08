export enum DoctorStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

export interface Doctor {
  id: string; 
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  telephone?: string;
  speciality_id: string;
  blood_type?: string;
  doctor_status?: DoctorStatus; 
  is_active: boolean;
  is_admin?: boolean;
  is_superuser?: boolean;
  last_login?: string; 
  date_joined: string; 
  address?: string;
  is_banned?: boolean;
}

export interface DoctorCreate {
  id?: string; 
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  telephone?: string;
  speciality_id: string;
  blood_type?: string;
  doctor_status?: DoctorStatus; 
  address?: string;
}

export interface DoctorUpdate {
  username?: string;
  first_name?: string;
  last_name?: string;
  telephone?: string;
  email?: string;
  speciality_id?: string; 
  address?: string;
  doctor_status?: DoctorStatus;
}

export interface DoctorUpdateResponse {
  username: string;
  first_name: string;
  last_name: string;
  telephone: string;
  email: string;
  speciality_id: string;
  address: string;
  doctor_status?: DoctorStatus; 
}

// Resto de las interfaces sin cambios
export interface TokenDoctorsResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  doc: Doctor;
}

export interface DoctorUpdatePassword {
  password: string;
}

export interface DoctorDelete {
  id: string; // UUID
  message: string;
}

export interface MedicalSchedule {
  id: string; // UUID
  time_medic: string;
  day: string;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  doctors?: string[]; // IDs de doctores
}

export interface DoctorMeResponse {
  doc: Doctor;
  schedules: MedicalSchedule[];
}