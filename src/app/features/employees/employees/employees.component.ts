import { AfterViewInit, Component, DestroyRef, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, map } from 'rxjs/operators';

import { EmployeeService } from '../services/employee.service';
import { Employee } from '../../../core/interfaces/employee.interface';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-employees',
  imports: [
    DecimalPipe,
    DatePipe,
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
  private readonly employeeService = inject(EmployeeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchSubject$ = new BehaviorSubject<string>('');
  readonly departmentSubject$ = new BehaviorSubject<string>('');

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = false;
  selectedDepartment = '';
  searchValue = '';
  datasource = new MatTableDataSource<Employee>();

  readonly displayedColumns: string[] = [
    'id',
    'employeeName',
    'email',
    'department',
    'salary',
    'joiningDate',
    'actions'
  ];

  departments: string[] = [];

  ngOnInit(): void {
    this.setupUnifiedFilterStream();
    this.loadDepartments();
  }

  ngAfterViewInit(): void {
    this.datasource.paginator = this.paginator;
    this.datasource.sort = this.sort;
  }

  // --- Unified Reactive Filter Stream (combineLatest + switchMap) ---
  private setupUnifiedFilterStream(): void {
    combineLatest({
      search: this.searchSubject$.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ),
      department: this.departmentSubject$.pipe(
        distinctUntilChanged()
      )
    })
      .pipe(
        tap(() => (this.isLoading = true)),
        switchMap(({ search, department }) => {
          const fetchStream$ = search.trim()
            ? this.employeeService.searchEmployees(search)
            : this.employeeService.getEmployees();

          return fetchStream$.pipe(
            map((employees: Employee[]) => {
              if (!department) return employees;
              return employees.filter(emp => emp.department === department);
            }),
            catchError((error) => {
              this.showSnackBar('Unable to load employee records');
              return of([] as Employee[]);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (filteredEmployees: Employee[]) => {
          this.datasource.data = filteredEmployees;
          this.isLoading = false;
          if (this.datasource.paginator) {
            this.datasource.paginator.firstPage();
          }
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  // --- Dynamic Department Loading ---
  private loadDepartments(): void {
    this.employeeService
      .getDepartments()
      .pipe(
        catchError(() => {
          // Fallback options in case service fails
          return of(['IT', 'HR', 'Finance', 'Manager']);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((departments: string[]) => {
        this.departments = departments;
      });
  }

  // --- Filter Event Handlers ---
  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue = value;
    this.searchSubject$.next(value);
  }

  applyDepartmentFilter(department: string): void {
    this.selectedDepartment = department;
    this.departmentSubject$.next(department);
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedDepartment = '';
    this.searchSubject$.next('');
    this.departmentSubject$.next('');

    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
  }

  // Refresh stream after CRUD changes
  refreshData(): void {
    this.searchSubject$.next(this.searchValue);
  }

  // --- CRUD Operations ---
  addEmployee(): void {
    const dialogRef = this.dialog.open(EmployeeFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
      data: { departments: this.departments }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((employee) => {
      if (employee) {
        this.createEmployee(employee);
      }
    });
  }

  private createEmployee(employee: Employee): void {
    this.employeeService.createEmployee(employee).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.showSnackBar('Employee created successfully');
        this.refreshData();
      },
      error: () => this.showSnackBar('Unable to create employee')
    });
  }

  onEditEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeFormComponent, {
      width: '650px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        mode: 'edit',
        employee,
        departments: this.departments
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updatedEmployee) => {
      if (updatedEmployee && employee.id) {
        this.updateEmployee(employee.id, updatedEmployee);
      }
    });
  }

  private updateEmployee(id: number, employee: Employee): void {
    this.employeeService.updateEmployee(id, employee).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.showSnackBar('Employee updated successfully');
        this.refreshData();
      },
      error: () => this.showSnackBar('Unable to update employee')
    });
  }

  onDeleteEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: {
        title: 'Delete Employee',
        message: `Are you sure you want to delete ${employee.employeeName}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (confirmed && employee.id) {
        this.deleteEmployee(employee.id);
      }
    });
  }

  private deleteEmployee(id: number): void {
    this.employeeService.deleteEmployee(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.showSnackBar('Employee deleted successfully');
        this.refreshData();
      },
      error: () => this.showSnackBar('Unable to delete employee')
    });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3500,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}