import { Role } from '../enums/role.enum';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  enabled: boolean;
  mustChangePassword: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  temporaryPassword: string;
  role: Role;
}