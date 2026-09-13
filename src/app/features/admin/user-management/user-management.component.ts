import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';

import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import {
  CreateUserDialogComponent
} from './create-user-dialog/create-user-dialog.component';

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
    MatDialogModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  users: User[] = [];

  loading = false;

  readonly displayedColumns: string[] = [
    'username',
    'email',
    'role',
    'status',
    'mustChangePassword'
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {

    this.loading = true;

    this.userService
      .getUsers()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: users => {
          this.users = users;
        },

        error: error => {

          console.error(
            'Error loading users',
            error
          );

          this.snackBar.open(
            'Unable to load users',
            'Close',
            {
              duration: 3000
            }
          );
        }

      });
  }

  openCreateUser(): void {

    const dialogRef =
      this.dialog.open(
        CreateUserDialogComponent,
        {
          width: '500px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          disableClose: true
        }
      );

    dialogRef
      .afterClosed()
      .subscribe(result => {

        if (result) {
          this.loadUsers();
        }

      });
  }
}