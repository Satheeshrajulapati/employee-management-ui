import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',

    loadComponent: () =>
      import(
        './features/auth/login/login.component'
      ).then(
        m => m.LoginComponent
      )
  },

  {
    path: 'change-password',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import(
        './features/auth/change-password/change-password.component'
      ).then(
        m => m.ChangePasswordComponent
      )
  },

  {
    path: '',

    loadComponent: () =>
      import(
        './core/layout/layout.component'
      ).then(
        m => m.LayoutComponent
      ),

    canActivate: [
      authGuard
    ],

    children: [

      {
        path: 'dashboard',

        loadComponent: () =>
          import(
            './features/dashboard/dashboard.component'
          ).then(
            m => m.DashboardComponent
          )
      },

      {
        path: 'employees',

        loadComponent: () =>
          import(
            './features/employees/employees/employees.component'
          ).then(
            m => m.EmployeesComponent
          )
      },

      {
        path: 'admin/users',

        canActivate: [
          adminGuard
        ],

        loadComponent: () =>
          import(
            './features/admin/user-management/user-management.component'
          ).then(
            m => m.UserManagementComponent
          )
      },

      {
        path: 'settings',

        canActivate: [
          superAdminGuard
        ],

        loadComponent: () =>
          import(
            './features/settings/settings.component'
          ).then(
            m => m.SettingsComponent
          )
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }

];