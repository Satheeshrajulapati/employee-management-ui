import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./features/employees/components/employee-list/employee-list.component')
        .then(m => m.EmployeeListComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];