export interface ChatResponse {
  id: string;
  doc_1?: DoctorResponse;
  doc_2?: DoctorResponse;
  messages?: MessageResponse[];
}

export interface DoctorResponse {
  id: string;
  is_active: boolean;
  is_admin: boolean;
  is_superuser: boolean;
  last_login?: string;
  date_joined: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  telephone?: string;
  speciality_id?: string;
}

export interface MessageResponse {
  id: string;
  content: string;
  created_at: string;
  deleted_at?: string;
  sender?: DoctorResponse;
  chat?: ChatResponse;
}

export interface WebSocketMessage {
  type: 'message' | 'presence';
  message?: MessageResponse;
  user?: string;
  status?: 'online' | 'offline';
}