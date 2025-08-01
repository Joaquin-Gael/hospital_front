export interface UserRead {
  id: number;
  is_active: boolean;
  is_admin: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  dni: string;
  address?: string;
  telephone?: string;
  blood_type?: string;
  img_profile?: string;
}

export interface UserCreate {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  dni: string;
  password: string;
  address?: string;
  blood_type: string;
  is_superuser?: boolean;
  is_admin?: boolean; 
  img_profile?: string;
}

export interface UserUpdate {
  username?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  telephone?: string;
  password?: string;
  img_profile?: string;
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