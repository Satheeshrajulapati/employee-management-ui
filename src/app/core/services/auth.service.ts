import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Role } from '../enums/role.enum';

interface LoginRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  message: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
        })
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

    if (Object.values(Role).includes(role)) {
      return role as Role;
    }

    return null;

  } catch {
    return null;
  }
}

  isAdmin(): boolean {
    return this.getRole() === Role.ADMIN;
  }

  isUser(): boolean {
    return this.getRole() === Role.USER;
  }

  isLoggedIn(): boolean {
  return !!this.getToken() && !this.isTokenExpired();
}

  logout(): void {
    localStorage.removeItem('token');
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

    const currentTime = Math.floor(Date.now() / 1000);

    return expiry < currentTime;

  } catch {
    return true;
  }
}

}