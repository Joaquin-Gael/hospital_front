export interface UserResponse{
  user: User;
}

export interface User {
    id: string;
    is_active: boolean;
    is_admin: boolean;
    is_superuser: boolean;
    last_login: string | null;
    date_joined: string;
    username: string;
    email: string;
    telephone: string;
    first_name: string;
    last_name: string;
    dni: string;
    address: string;
}