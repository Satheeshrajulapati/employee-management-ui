import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateUserRequest,
  User
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/admin/users`;

  getUsers(): Observable<User[]> {

    return this.http.get<User[]>(
      this.apiUrl
    );
  }

  createUser(
    request: CreateUserRequest
  ): Observable<User> {

    return this.http.post<User>(
      this.apiUrl,
      request
    );
  }

  updateUserStatus(
    userId: number,
    enabled: boolean
  ): Observable<User> {

    return this.http.patch<User>(
      `${this.apiUrl}/${userId}/status`,
      { enabled }
    );
  }

  resetUserPassword(userId: number, temporaryPassword: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${userId}/reset-password`,
      { temporaryPassword }
    );
  }

}