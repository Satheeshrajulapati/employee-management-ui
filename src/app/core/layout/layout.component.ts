import { Component, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly username =
    this.authService.getUsername();

  readonly role =
    this.authService.getRole();

  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen =
      !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout(): void {

    this.closeSidebar();

    this.authService.logout();

    this.router.navigate([
      '/login'
    ]);
  }
}