import { Doctor } from './doctor.interfaces'
export interface Auth {
email: string;
password: string;
}
export interface Service {
  id: string;
  name?: string;
  description?: string;
  price: number;
  icon_code?: string;
  is_available: boolean;
  available_doctors_count?: number | null;
  specialty?: Specialty | null;
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
department_id: string;
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
icon_code?: string;
}
export interface ServiceUpdate {
name?: string;
description?: string;
price?: number;
specialty_id: string; // UUID
icon_code?: string;
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
location_id: string;
}
export interface LocationDelete {
location_id: string; // UUID
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
start_time: string; // HH:mm:ss
end_time: string; // HH:mm:ss
}
export interface MedicalScheduleUpdate {
id: string; // UUID
day?: string;
start_time?: string; // HH:mm:ss
end_time?: string; // HH:mm:ss
doctors?: Doctor[];
}
export interface MedicalScheduleDelete {
id: string; // UUID
message: string;
}
export interface MedicalScheduleDaysResponse{
  available_days: MedicalScheduleCreate[];
}
export interface MedicalScheduleDaysRequest {
  specialtyId: string;
  date?: string;
}
// Agrega esta interfaz en doctor.interfaces.ts (asumiendo que es el archivo importado)
export interface MedicalSchedule {
id?: string; // Opcional para compatibilidad con getAvailableDays
time_medic?: string; // Opcional, ajusta según su uso (quizás es un campo para duración o tiempo médico)
day: string;
start_time: string;
end_time: string;
doctor_id?: string; // Opcional
specialty_id?: string; // Opcional
}
// Opcional: Enum para días de la semana
export enum WeekDay {
Monday = 'monday',
Tuesday = 'tuesday',
Wednesday = 'wednesday',
Thursday = 'thursday',
Friday = 'friday',
Saturday = 'saturday',
Sunday = 'sunday'
}
export interface AvailableDay {
day: WeekDay; 
start_time: string;
end_time: string;
}