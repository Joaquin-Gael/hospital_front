export interface Doctor {
  id: string; // UUID
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  telephone?: string;
  speciality_id: string; // UUID
  blood_type?: string;
  is_active: boolean;
  is_admin?: boolean;
  is_superuser?: boolean;
  last_login?: string; // ISO 8601
  date_joined: string; // ISO 8601
  address?: string;
  is_banned?: boolean;
}

export interface DoctorCreate {
  id?: string; // UUID, opcional (generado por backend si no se provee)
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  telephone?: string;
  speciality_id: string; // UUID
  blood_type?: string;
  address?: string;
}

export interface DoctorUpdate {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  telephone?: string;
  speciality_id?: string; // UUID
  blood_type?: string;
  address?: string;
  is_active?: boolean;
  is_admin?: boolean;
  is_superuser?: boolean;
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