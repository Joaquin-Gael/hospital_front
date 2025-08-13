export interface UserRead {
  id: string;
  is_active: boolean;
  is_admin: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  dni: string | null;
  address: string | null;
  telephone: string | null;
  blood_type: string | null;
  health_insurance: string[];
  img_profile: string | null;
}

export interface UserCreate {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  dni: string;
  telephone?: string;
  address?: string;
  blood_type: string;
  health_insurance: string[];
  password: string;
}

export interface UserUpdate {
  username?: string;
  first_name?: string;
  last_name?: string;
  telephone?: string;
  address?: string;
  health_insurance?: string[];
  img_profile?: File;
}

export interface UserDelete {
  id: string;
}

export interface TokenUserResponse {
  token_type: string;
  user: UserRead;
  access_token: string;
  refresh_token: string;
}

export interface DecodeResponse {
  access_token: string;
}

export interface ScopesResponse {
  scopes: string[];
}