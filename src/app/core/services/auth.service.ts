import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role } from '../enums/role.enum';

interface LoginRequest {
  username: string;
  password: string;
}

interface JwtPayload {
  sub?: string;
  role?: Role;
  exp?: number;
}

export interface AuthResponse {
  message: string;
  token: string | null;
  username: string;
  role: Role;
  mustChangePassword: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl =
    `${environment.apiUrl}/auth`;

  private readonly storageKeys = {
    token: 'token',
    mustChangePassword: 'mustChangePassword'
  } as const;

  constructor(
    private readonly http: HttpClient
  ) {}

  login(
    username: string,
    password: string
  ): Observable<AuthResponse> {

    const request: LoginRequest = {
      username,
      password
    };

    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/login`,
        request
      )
      .pipe(
        tap(response => {
          if (response.token) {
            this.storeAuthData(response);
          }
        })
      );
  }

  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<void> {

    return this.http.put<void>(
      `${environment.apiUrl}/account/change-password`,
      {
        currentPassword,
        newPassword
      }
    );
  }

  getToken(): string | null {
    return localStorage.getItem(
      this.storageKeys.token
    );
  }

  getUsername(): string | null {
    return this.getTokenPayload()?.sub ?? null;
  }

  getRole(): Role | null {

    const role =
      this.getTokenPayload()?.role;

    return role &&
      Object.values(Role).includes(role)
      ? role
      : null;
  }

  getRoleLabel(): string {

    switch (this.getRole()) {

      case Role.SUPER_ADMIN:
        return 'Super Admin';

      case Role.ADMIN:
        return 'Admin';

      case Role.USER:
        return 'User';

      default:
        return '';
    }
  }

  mustChangePassword(): boolean {

    return localStorage.getItem(
      this.storageKeys.mustChangePassword
    ) === 'true';
  }

  setMustChangePassword(
    value: boolean
  ): void {

    localStorage.setItem(
      this.storageKeys.mustChangePassword,
      String(value)
    );
  }

  isSuperAdmin(): boolean {
    return this.getRole() ===
      Role.SUPER_ADMIN;
  }

  isAdmin(): boolean {
    return this.getRole() ===
      Role.ADMIN;
  }

  isUser(): boolean {
    return this.getRole() ===
      Role.USER;
  }

  canManageUsers(): boolean {

    const role = this.getRole();

    return role === Role.SUPER_ADMIN ||
      role === Role.ADMIN;
  }

  canManageEmployees(): boolean {

    const role = this.getRole();

    return role === Role.SUPER_ADMIN ||
      role === Role.ADMIN;
  }

  canAccessSettings(): boolean {
    return this.isSuperAdmin();
  }

  isLoggedIn(): boolean {

    return !!this.getToken() &&
      !this.isTokenExpired();
  }

  isTokenExpired(): boolean {

    const expiry =
      this.getTokenPayload()?.exp;

    if (!expiry) {
      return true;
    }

    return expiry <
      Math.floor(Date.now() / 1000);
  }

  logout(): void {

    Object.values(
      this.storageKeys
    ).forEach(key =>
      localStorage.removeItem(key)
    );
  }

  private storeAuthData(
    response: AuthResponse
  ): void {

    if (!response.token) {
      return;
    }

    localStorage.setItem(
      this.storageKeys.token,
      response.token
    );

    this.setMustChangePassword(
      response.mustChangePassword
    );
  }

  private getTokenPayload():
    JwtPayload | null {

    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {

      return JSON.parse(
        atob(token.split('.')[1])
      ) as JwtPayload;

    } catch {

      return null;
    }
  }
}