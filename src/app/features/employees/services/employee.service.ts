import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Employee } from '../../../core/interfaces/employee.interface';
import { PageResponse } from '../../../core/models/page-response.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/employees`;

  getEmployees(
    page: number,
    size: number,
    search: string = '',
    department: string = '',
    sort: string = 'id,asc'
  ): Observable<PageResponse<Employee>> {

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('search', search)
      .set('department', department)
      .set('sort', sort);

    return this.http.get<PageResponse<Employee>>(
      this.apiUrl,
      { params }
    );
  }

  employeesById(id: number): Observable<Employee> {
    return this.http.get<Employee>(
      `${this.apiUrl}/${id}`
    );
  }

  createEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(
      this.apiUrl,
      employee
    );
  }

  updateEmployee(
    id: number,
    employee: Employee
  ): Observable<Employee> {

    return this.http.put<Employee>(
      `${this.apiUrl}/${id}`,
      employee
    );
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/departments`
    );
  }
}