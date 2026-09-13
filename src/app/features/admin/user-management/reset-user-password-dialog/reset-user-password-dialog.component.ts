import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-reset-user-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './reset-user-password-dialog.component.html',
  styleUrl: './reset-user-password-dialog.component.scss'
})
export class ResetUserPasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ResetUserPasswordDialogComponent>);

  readonly user = inject<User>(MAT_DIALOG_DATA);
  loading = false;
  hidePassword = true;

  readonly form = this.fb.nonNullable.group({
    temporaryPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  resetPassword(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.userService.resetUserPassword(
      this.user.id,
      this.form.getRawValue().temporaryPassword
    )
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: () => {
        this.snackBar.open('Password reset successfully', 'Close', {
          duration: 3000
        });
        this.dialogRef.close(true);
      },
      error: error => {
        const message = error?.error?.message ?? 'Unable to reset password';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}