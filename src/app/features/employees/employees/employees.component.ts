import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DecimalPipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EmployeeService } from '../services/employee.service';
import { Employee } from '../../../core/interfaces/employee.interface';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { catchError, finalize, throwError } from 'rxjs';

@Component({
  selector: 'app-employees',
  imports: [
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit, AfterViewInit {

  private employeeService = inject(EmployeeService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild('searchInput')
  searchInput!: ElementRef<HTMLInputElement>;

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  @ViewChild(MatSort)
  sort!: MatSort;

  isLoading = false;

  displayedColumns = [
    'id',
    'employeeName',
    'email',
    'department',
    'salary',
    'actions'
  ];

  departments = [
    'IT',
    'HR',
    'Finance',
    'Manager'
  ];

  selectedDepartment = '';
  searchValue = '';
  datasource = new MatTableDataSource<Employee>();

  ngOnInit(): void {
    this.datasource.filterPredicate =
      (employee: Employee, filter: string): boolean => {
        const filterData = JSON.parse(filter);
        const search = filterData.search;
        const department = filterData.department;

        const matchesSearch =
          !search ||
          employee.employeeName
            .toLowerCase()
            .includes(search) ||
          employee.email
            .toLowerCase()
            .includes(search);

        const matchesDepartment =
          !department ||
          employee.department === department;

        return matchesSearch && matchesDepartment;
      };

    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    this.datasource.paginator = this.paginator;
    this.datasource.sort = this.sort;
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService
      .getEmployees().pipe(

        catchError((error) => {
          return throwError(() => error)
        }),

        finalize(() => {
          this.isLoading = false;
        })

      )
      .subscribe({
        next: (employees) => {
          this.datasource.data = employees;
        },

        error: (error) => {
          console.error(
            'Error loading employees:',
            error
          );
        }

      });
  }

  addEmployee(): void {
    const dialogRef = this.dialog.open(EmployeeFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(
      (employee) => {
        if (!employee) {
          return;
        }

        this.createEmployee(employee);
      }
    );
  }

  private createEmployee(employee: Employee): void {
    this.employeeService
      .createEmployee(employee)
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Employee created successfully',
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            }
          );
          this.loadEmployees();
        },

        error: (error) => {
          this.snackBar.open(
            'Unable to create employee',
            'Close',
            {
              duration: 4000,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            }
          );
        }
      });
  }

  onEditEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(
      EmployeeFormComponent,
      {
        width: '650px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          mode: 'edit',
          employee
        }
      }
    );

    dialogRef.afterClosed().subscribe(
      (updatedEmployee) => {

        if (!updatedEmployee) {
          return;
        }

        this.updateEmployee(
          employee.id!,
          updatedEmployee
        );
      }
    );
  }

  private updateEmployee(
    id: number,
    employee: Employee
  ): void {

    this.employeeService
      .updateEmployee(id, employee)
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Employee updated successfully',
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            }
          );

          this.loadEmployees();
        },

        error: (error) => {
          console.error(
            'Error updating employee:',
            error
          );

          this.snackBar.open(
            'Unable to update employee',
            'Close',
            {
              duration: 4000,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            }
          );
        }
      });
  }

  onDeleteEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        width: '450px',
        maxWidth: '95vw',
        data: {
          title: 'Delete Employee',
          message: `Are you sure you want to delete ${employee.employeeName}?`,
          confirmText: 'Delete',
          cancelText: 'Cancel'
        }

      }
    );

    dialogRef.afterClosed().subscribe(
      (confirmed) => {
        if (!confirmed) {
          return;
        }
        this.deleteEmployee(employee.id!);
      }
    )
  }

  private deleteEmployee(id: number): void {
    this.employeeService.deleteEmployee(id).subscribe({
      next: () => {
        this.snackBar.open(
          'Employee deleted successfully',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          }
        );
        this.loadEmployees();
      }
    })
  }

  applyFilter(event: Event): void {
    this.searchValue =
      (event.target as HTMLInputElement)
        .value
        .trim()
        .toLowerCase();

    this.applyFilters();
  }

  applyDepartmentFilter(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    const filter = {
      search: this.searchValue,
      department: this.selectedDepartment
    };
    this.datasource.filter = JSON.stringify(filter);

    if (this.datasource.paginator) {
      this.datasource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedDepartment = '';
    this.datasource.filter = '';

    // Clear search input
    this.searchInput.nativeElement.value = '';
    if (this.datasource.paginator) {
      this.datasource.paginator.firstPage();
    }
  }

}
