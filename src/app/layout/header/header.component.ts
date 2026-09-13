import { Component, inject } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  private readonly authService =
    inject(AuthService);

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}