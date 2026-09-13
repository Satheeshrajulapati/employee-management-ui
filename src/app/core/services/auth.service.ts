import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Role } from '../enums/role.enum';

interface LoginRequest {
  username: string;
  password: string;
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

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private readonly http: HttpClient
  ) { }

  login(
    username: string,
    password: string
  ): Observable<AuthResponse> {

    const request: LoginRequest = {
      username,
      password
    };

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      request
    ).pipe(

      tap(response => {

        if (!response.token) {
          return;
        }

        localStorage.setItem(
          'token',
          response.token
        );

        localStorage.setItem(
          'username',
          response.username
        );

        localStorage.setItem(
          'role',
          response.role
        );

        localStorage.setItem(
          'mustChangePassword',
          String(response.mustChangePassword)
        );
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
    return localStorage.getItem('token');
  }

  getRole(): Role | null {

    const token = this.getToken();

    if (!token || this.isTokenExpired()) {
      return null;
    }

    try {

      const payload = JSON.parse(
        atob(token.split('.')[1])
      );

      const role = payload.role;

      if (
        Object.values(Role).includes(role)
      ) {
        return role as Role;
      }

      return null;

    } catch {
      return null;
    }
  }

  getUsername(): string | null {

    const token = this.getToken();

    if (!token || this.isTokenExpired()) {
      return null;
    }

    try {

      const payload = JSON.parse(
        atob(token.split('.')[1])
      );

      return payload.sub ?? null;

    } catch {
      return null;
    }
  }

  mustChangePassword(): boolean {

    return localStorage.getItem(
      'mustChangePassword'
    ) === 'true';
  }

  isAdmin(): boolean {
    return this.getRole() === Role.ADMIN;
  }

  isUser(): boolean {
    return this.getRole() === Role.USER;
  }

  isLoggedIn(): boolean {

    return !!this.getToken()
      && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {

    const token = this.getToken();

    if (!token) {
      return true;
    }

    try {

      const payload = JSON.parse(
        atob(token.split('.')[1])
      );

      const expiry = payload.exp;

      if (!expiry) {
        return true;
      }

      const currentTime =
        Math.floor(Date.now() / 1000);

      return expiry < currentTime;

    } catch {
      return true;
    }
  }

  logout(): void {

    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem(
      'mustChangePassword'
    );
  }
}