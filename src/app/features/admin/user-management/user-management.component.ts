import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ResetUserPasswordDialogComponent } from './reset-user-password-dialog/reset-user-password-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  readonly currentUsername = this.authService.getUsername();

  users: User[] = [];
  loading = false;

  readonly displayedColumns: string[] = [
    'username',
    'email',
    'role',
    'status',
    'mustChangePassword',
    'actions'
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;

    this.userService.getUsers()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: users => {
          this.users = users;
        },
        error: error => {
          console.error('Error loading users', error);
          this.snackBar.open('Unable to load users', 'Close', {
            duration: 3000
          });
        }
      });
  }

  openCreateUser(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.enabled;
    const action = newStatus ? 'Enable' : 'Disable';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      data: {
        title: `${action} User`,
        message: `Are you sure you want to ${action.toLowerCase()} ${user.username}?`,
        confirmText: action,
        cancelText: 'Cancel',
        confirmColor: newStatus ? 'primary' : 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.updateUserStatus(user, newStatus);
      }
    });
  }

  private updateUserStatus(user: User, enabled: boolean): void {
    this.userService.updateUserStatus(user.id, enabled)
      .subscribe({
        next: updatedUser => {
          this.users = this.users.map(currentUser =>
            currentUser.id === updatedUser.id ? updatedUser : currentUser
          );

          this.snackBar.open(
            updatedUser.enabled
              ? 'User enabled successfully'
              : 'User disabled successfully',
            'Close',
            { duration: 3000 }
          );
        },
        error: error => {
          const message =
            error?.error?.message ?? 'Unable to update user status';

          this.snackBar.open(message, 'Close', {
            duration: 3000
          });
        }
      });
  }

  isCurrentUser(user: User): boolean {
  return user.username === this.currentUsername;
}

openResetPassword(user: User): void {
  const dialogRef = this.dialog.open(
    ResetUserPasswordDialogComponent,
    {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: user
    }
  );

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadUsers();
    }
  });
}

}