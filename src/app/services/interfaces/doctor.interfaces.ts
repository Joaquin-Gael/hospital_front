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
  doctor_state: string,
  is_active: boolean;
  is_admin?: boolean;
  is_superuser?: boolean;
  last_login?: string; // ISO 8601
  date_joined: string; // ISO 8601
  address?: string;
  is_banned?: boolean;
}

export interface TokenDoctorsResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  doc: Doctor;
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
  doctor_state?: string;
  address?: string;
}

export interface DoctorUpdatePassword {
  password: string;
}

export interface DoctorUpdate {
  username?: string;
  first_name?: string;
  last_name?: string;
  telephone?: string;
  email?: string;
  speciality_id?: string; // UUID
  address?: string;
  doctor_state?: string;
}
export interface DoctorUpdateResponse {
  username: string;
  first_name: string;
  last_name: string;
  telephone: string;
  email: string;
  speciality_id: string;
  address: string;
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