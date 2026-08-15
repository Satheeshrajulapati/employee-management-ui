import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/layout.component')
        .then(m => m.LayoutComponent),

        children: [
          { path: 'dashboard',
            loadComponent: () =>
              import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },

          {
            path: 'employees',
            loadComponent: () => 
              import('./features/employees/employees/employees.component').then(m => m.EmployeesComponent)
          },

          {
            path: 'settings',
            loadComponent: () =>
              import('./features/settings/settings.component').then(m => m.SettingsComponent)
          }
        ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];