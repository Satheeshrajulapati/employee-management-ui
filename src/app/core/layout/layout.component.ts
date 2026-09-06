import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIcon } from "@angular/material/icon";
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatIcon
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {

  private authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly username = this.authService.getUsername();
  readonly role = this.authService.getRole();

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
