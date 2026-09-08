import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';

import {
  MatTableDataSource,
  MatTableModule
} from '@angular/material/table';

import { MatButtonModule } from '@angular/material/button';

import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';

import {
  MatSort,
  MatSortModule,
  Sort
} from '@angular/material/sort';

import { MatDialog } from '@angular/material/dialog';

import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';

import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  BehaviorSubject,
  of,
  timer
} from 'rxjs';

import {
  catchError,
  debounce,
  distinctUntilChanged,
  map,
  switchMap,
  tap
} from 'rxjs/operators';

import { EmployeeService } from '../services/employee.service';
import { Employee } from '../../../core/interfaces/employee.interface';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AuthService } from '../../../core/services/auth.service';

interface EmployeeQueryState {
  page: number;
  size: number;
  search: string;
  department: string;
  sortActive: string;
  sortDirection: 'asc' | 'desc';
  refreshKey: number;
}

interface EmployeeQueryEvent {
  state: EmployeeQueryState;
  debounceSearch: boolean;
}

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
export class EmployeesComponent implements OnInit {

  private readonly employeeService = inject(EmployeeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  readonly isAdmin = this.authService.isAdmin();

  @ViewChild('searchInput')
  searchInput!: ElementRef<HTMLInputElement>;

  private paginatorInstance?: MatPaginator;
  private sortInstance?: MatSort;

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator | undefined) {

    if (!paginator || this.paginatorInstance === paginator) {
      return;
    }

    this.paginatorInstance = paginator;

    paginator.page
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event: PageEvent) => {

        console.log(
          'Loading page:',
          event.pageIndex,
          'size:',
          event.pageSize
        );

        this.queryState = {
          ...this.queryState,
          page: event.pageIndex,
          size: event.pageSize
        };

        this.emitQuery(false);
      });
  }

  @ViewChild(MatSort)
  set sort(sort: MatSort | undefined) {

    if (!sort || this.sortInstance === sort) {
      return;
    }

    this.sortInstance = sort;

    sort.sortChange
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((sortEvent: Sort) => {

        this.resetPaginatorView();

        this.queryState = {
          ...this.queryState,
          page: 0,
          sortActive: sortEvent.active || 'id',
          sortDirection:
            sortEvent.direction === 'desc'
              ? 'desc'
              : 'asc'
        };

        this.emitQuery(false);
      });
  }

  isLoading = false;
  selectedDepartment = '';
  searchValue = '';
  totalElements = 0;

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

  private queryState: EmployeeQueryState = {
    page: 0,
    size: 5,
    search: '',
    department: '',
    sortActive: 'id',
    sortDirection: 'asc',
    refreshKey: 0
  };

  private readonly querySubject$ =
    new BehaviorSubject<EmployeeQueryEvent>({
      state: { ...this.queryState },
      debounceSearch: false
    });

  ngOnInit(): void {
    this.setupEmployeeStream();
    this.loadDepartments();
  }



  // -----------------------------------
  // Unified Server-side Data Stream
  // -----------------------------------

  private setupEmployeeStream(): void {

    this.querySubject$
      .pipe(

        /*
         * Search waits 400ms.
         * Pagination, department, sorting and refresh run immediately.
         *
         * A new event also cancels a pending search debounce, which
         * prevents duplicate/outdated API calls.
         */
        debounce(event =>
          event.debounceSearch
            ? timer(400)
            : of(0)
        ),

        map(event => event.state),

        distinctUntilChanged((previous, current) =>
          previous.page === current.page &&
          previous.size === current.size &&
          previous.search === current.search &&
          previous.department === current.department &&
          previous.sortActive === current.sortActive &&
          previous.sortDirection === current.sortDirection &&
          previous.refreshKey === current.refreshKey
        ),

        tap(() => {
          this.isLoading = true;
        }),

        switchMap(state => {

          const sortParam =
            `${state.sortActive},${state.sortDirection}`;

          return this.employeeService
            .getEmployees(
              state.page,
              state.size,
              state.search.trim(),
              state.department,
              sortParam
            )
            .pipe(

              catchError(() => {

                this.showSnackBar(
                  'Unable to load employee records'
                );

                return of({
                  content: [],
                  totalElements: 0,
                  totalPages: 0,
                  size: state.size,
                  number: state.page,
                  first: true,
                  last: true
                });
              })
            );
        }),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {

        console.log(
          'Backend page:',
          response.number
        );

        console.log(
          'Employees:',
          response.content
        );

        console.log(
          'Total:',
          response.totalElements
        );

        // If the current page becomes empty after deleting the
        // last record on that page, move to the previous page.
        if (
          response.content.length === 0 &&
          response.totalElements > 0 &&
          this.queryState.page > 0
        ) {

          const previousPage =
            this.queryState.page - 1;

          this.queryState = {
            ...this.queryState,
            page: previousPage
          };

          if (this.paginatorInstance) {
            this.paginatorInstance.pageIndex =
              previousPage;
          }

          // Keep the loader active while the previous
          // valid page is requested.
          this.emitQuery(false);

          return;
        }

        this.datasource.data = [
          ...response.content
        ];

        this.totalElements =
          response.totalElements;

        this.isLoading = false;
      });
  }

  // -----------------------------------
  // Query helpers
  // -----------------------------------

  private emitQuery(debounceSearch: boolean): void {

    this.querySubject$.next({
      state: { ...this.queryState },
      debounceSearch
    });
  }

  private resetPaginatorView(): void {

    if (this.paginatorInstance) {
      this.paginatorInstance.pageIndex = 0;
    }
  }

  // -----------------------------------
  // Departments
  // -----------------------------------

  private loadDepartments(): void {

    this.employeeService
      .getDepartments()
      .pipe(

        catchError(() => {
          return of([
            'IT',
            'HR',
            'Finance',
            'Manager'
          ]);
        }),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((departments: string[]) => {
        this.departments = departments;
      });
  }

  // -----------------------------------
  // Search
  // -----------------------------------

  applyFilter(event: Event): void {

    const value =
      (event.target as HTMLInputElement).value;

    this.searchValue = value;

    this.resetPaginatorView();

    this.queryState = {
      ...this.queryState,
      page: 0,
      search: value
    };

    this.emitQuery(true);
  }

  // -----------------------------------
  // Department Filter
  // -----------------------------------

  applyDepartmentFilter(department: string): void {

    this.selectedDepartment = department;

    this.resetPaginatorView();

    this.queryState = {
      ...this.queryState,
      page: 0,
      department
    };

    this.emitQuery(false);
  }

  // -----------------------------------
  // Clear Filters
  // -----------------------------------

  clearFilters(): void {

    this.searchValue = '';
    this.selectedDepartment = '';

    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }

    this.resetPaginatorView();

    this.queryState = {
      ...this.queryState,
      page: 0,
      search: '',
      department: ''
    };

    /*
     * Only one event is emitted, so Clear Filters
     * produces only one backend request.
     */
    this.emitQuery(false);
  }

  // -----------------------------------
  // Refresh after CRUD
  // -----------------------------------

  refreshData(): void {

    this.queryState = {
      ...this.queryState,
      refreshKey: this.queryState.refreshKey + 1
    };

    this.emitQuery(false);
  }

  // -----------------------------------
  // Add Employee
  // -----------------------------------

  addEmployee(): void {

    const dialogRef =
      this.dialog.open(
        EmployeeFormComponent,
        {
          width: '600px',
          maxWidth: '95vw',
          disableClose: true,
          data: {
            departments: this.departments
          }
        }
      );

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(employee => {

        if (employee) {
          this.createEmployee(employee);
        }
      });
  }

  private createEmployee(employee: Employee): void {

    this.employeeService
      .createEmployee(employee)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: () => {

          this.showSnackBar(
            'Employee created successfully'
          );

          this.refreshData();
        },

        error: () => {

          this.showSnackBar(
            'Unable to create employee'
          );
        }
      });
  }

  // -----------------------------------
  // Edit Employee
  // -----------------------------------

  onEditEmployee(employee: Employee): void {

    const dialogRef =
      this.dialog.open(
        EmployeeFormComponent,
        {
          width: '650px',
          maxWidth: '95vw',
          disableClose: true,
          data: {
            mode: 'edit',
            employee,
            departments: this.departments
          }
        }
      );

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(updatedEmployee => {

        if (
          updatedEmployee &&
          employee.id
        ) {

          this.updateEmployee(
            employee.id,
            updatedEmployee
          );
        }
      });
  }

  private updateEmployee(
    id: number,
    employee: Employee
  ): void {

    this.employeeService
      .updateEmployee(
        id,
        employee
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: () => {

          this.showSnackBar(
            'Employee updated successfully'
          );

          this.refreshData();
        },

        error: () => {

          this.showSnackBar(
            'Unable to update employee'
          );
        }
      });
  }

  // -----------------------------------
  // Delete Employee
  // -----------------------------------

  onDeleteEmployee(employee: Employee): void {

    const dialogRef =
      this.dialog.open(
        ConfirmDialogComponent,
        {
          width: '450px',
          maxWidth: '95vw',
          data: {
            title: 'Delete Employee',
            message:
              `Are you sure you want to delete ${employee.employeeName}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel'
          }
        }
      );

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(confirmed => {

        if (
          confirmed &&
          employee.id
        ) {

          this.deleteEmployee(
            employee.id
          );
        }
      });
  }

  private deleteEmployee(id: number): void {

    this.employeeService
      .deleteEmployee(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: () => {

          this.showSnackBar(
            'Employee deleted successfully'
          );

          this.refreshData();
        },

        error: () => {

          this.showSnackBar(
            'Unable to delete employee'
          );
        }
      });
  }

  // -----------------------------------
  // Snackbar
  // -----------------------------------

  private showSnackBar(message: string): void {

    this.snackBar.open(
      message,
      'Close',
      {
        duration: 3500,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  }

  exportEmployees(): void {

    this.isLoading = true;

    this.employeeService
      .exportEmployees(
        this.searchValue,
        this.selectedDepartment
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: (blob: Blob) => {

          const url =
            window.URL.createObjectURL(blob);

          const link =
            document.createElement('a');

          link.href = url;

          link.download =
            this.buildExportFileName();

          document.body.appendChild(link);

          link.click();

          document.body.removeChild(link);

          window.URL.revokeObjectURL(url);

          this.isLoading = false;

          this.showSnackBar(
            'Employees exported successfully'
          );
        },

        error: () => {

          this.isLoading = false;

          this.showSnackBar(
            'Unable to export employees'
          );
        }
      });
  }

  private buildExportFileName(): string {

    const today =
      new Date()
        .toISOString()
        .split('T')[0];

    if (this.selectedDepartment) {

      return `employees-${this.selectedDepartment}-${today}.xlsx`;
    }

    if (this.searchValue.trim()) {

      return `employees-search-${today}.xlsx`;
    }

    return `employees-${today}.xlsx`;
  }

}
