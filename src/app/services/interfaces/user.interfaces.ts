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
}

export interface UserCreate {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  dni: string;
  password: string;
  address?: string;
  is_superuser?: boolean;
  is_admin?: boolean; 
}

export interface UserUpdate {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  password?: string;
  address?: string;
  telephone?: string;
  blood_type?: string;
  is_admin?: boolean;
  is_superuser?: boolean;
}

export interface UserDelete {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  dni: string;
}

export interface TokenUserResponse {
  access_token: string;
  token_type: string;
  user: UserRead;
  refresh_token: string;
}

export interface ScopesResponse {
  scopes: string[];
}