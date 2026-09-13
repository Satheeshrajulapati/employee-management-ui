import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly mustChangePassword =
    this.authService.mustChangePassword();

  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  loading = false;

  readonly changePasswordForm =
    this.fb.nonNullable.group({
      currentPassword: [
        '',
        Validators.required
      ],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ],
      confirmPassword: [
        '',
        Validators.required
      ]
    });

  changePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.changePasswordForm.getRawValue();

    if (
      formValue.newPassword !==
      formValue.confirmPassword
    ) {
      this.snackBar.open(
        'New password and confirm password do not match',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.loading = true;

    this.authService
      .changePassword(
        formValue.currentPassword,
        formValue.newPassword
      )
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.authService.setMustChangePassword(false);

          this.snackBar.open(
            'Password changed successfully',
            'Close',
            { duration: 3000 }
          );

          this.router.navigate(['/employees']);
        },
        error: error => {
          const message =
            error?.error?.message ??
            'Unable to change password';

          this.snackBar.open(
            message,
            'Close',
            { duration: 3000 }
          );
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }
}