export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  specialty_id: string; // UUID
}

export interface Specialty {
  id: string; // UUID
  name: string;
  description: string;
  department_id: string; // UUID
  doctors?: string[]; // Doctor IDs
  services?: Service[];
}

export interface Department {
  id: string; // UUID
  name: string;
  description: string;
  location_id: string; // UUID
  specialities?: Specialty[];
}

export interface Location {
  id: string; // UUID
  name: string;
  description: string;
  departments?: Department[];
}

export interface SpecialtyCreate {
  name: string;
  description: string;
  department_id: string; // UUID
}

export interface SpecialtyUpdate {
  name?: string;
  description?: string;
  department_id?: string; // UUID
}

export interface SpecialtyDelete {
  id: string; // UUID
  message: string;
}

export interface ServiceCreate {
  name: string;
  description: string;
  price: number;
  specialty_id: string; // UUID
}

export interface ServiceUpdate {
  name?: string;
  description?: string;
  price?: number;
  specialty_id?: string; // UUID
}

export interface ServiceDelete {
  id: string; // UUID
  message: string;
}

export interface LocationCreate {
  name: string;
  description: string;
}

export interface LocationUpdate {
  name?: string;
  description?: string;
}

export interface LocationDelete {
  id: string; // UUID
  message: string;
}

export interface DepartmentCreate {
  name: string;
  description: string;
  location_id: string; // UUID
}

export interface DepartmentUpdate {
  name?: string;
  description?: string;
  location_id?: string; // UUID
}

export interface DepartmentDelete {
  id: string; // UUID
  message: string;
}

export interface MedicalScheduleCreate {
  day: string;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
}

export interface MedicalScheduleUpdate {
  id: string; // UUID
  day?: string;
  start_time?: string; // HH:mm
  end_time?: string; // HH:mm
}

export interface MedicalScheduleDelete {
  id: string; // UUID
  message: string;
}