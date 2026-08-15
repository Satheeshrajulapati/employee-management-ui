import { Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe } from '@angular/common';

import { EmployeeService } from '../services/employee.service';
import { Employee } from '../../../core/interfaces/employee.interface';

@Component({
  selector: 'app-employees',
  imports: [MatTableModule, MatButtonModule, DecimalPipe],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent {

  private employeeService = inject(EmployeeService);

  employees: Employee[] = [];

  displayedColumns: string[] = [
    'id',
    'employeeName',
    'email',
    'department',
    'salary'
  ];

  ngOnInit(){
    this.loadEmployees();
  }

  loadEmployees(){
    this.employeeService.getEmployees()
    .subscribe({
      next: (employees) => {
        this.employees = employees;
        console.log('Employees loaded successfully:', this.employees);
      },
      error: (error) =>{
        console.error('Error loading employees:', error);
      }
    })
  }

}
