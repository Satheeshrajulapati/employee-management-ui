import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs';
import {
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/enums/role.enum';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './create-user-dialog.component.html',
  styleUrl: './create-user-dialog.component.scss'
})
export class CreateUserDialogComponent {

  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly dialogRef =
    inject(MatDialogRef<CreateUserDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly currentRole =
    this.authService.getRole();

  readonly Role = Role;

  readonly availableRoles =
    this.currentRole === Role.SUPER_ADMIN
      ? [Role.ADMIN, Role.USER]
      : [Role.USER];

  loading = false;
  hidePassword = true;

  readonly createUserForm =
    this.fb.nonNullable.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      temporaryPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ],
      role: [
        Role.USER,
        Validators.required
      ]
    });

  createUser(): void {

    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const request =
      this.createUserForm.getRawValue();

    this.userService
      .createUser(request)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: user => {

          this.snackBar.open(
            `${this.formatRole(user.role)} created successfully`,
            'Close',
            {
              duration: 3000
            }
          );

          this.dialogRef.close(user);
        },

        error: error => {

          const message =
            error?.error?.message ??
            'Unable to create user';

          this.snackBar.open(
            message,
            'Close',
            {
              duration: 3000
            }
          );
        }
      });
  }

  formatRole(role: Role): string {

    switch (role) {

      case Role.SUPER_ADMIN:
        return 'Super Admin';

      case Role.ADMIN:
        return 'Admin';

      case Role.USER:
        return 'User';

      default:
        return 'User';
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}