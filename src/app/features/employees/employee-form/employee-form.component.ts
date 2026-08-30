import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { EmployeeDialogData } from '../../../interfaces/employee-dialog-data.interface';
import { Employee } from '../../../core/interfaces/employee.interface';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EmployeeFormComponent>);
  readonly dialogData = inject<EmployeeDialogData>(MAT_DIALOG_DATA, { optional: true });

  isEditMode = false;
  departments: string[] = ['IT', 'HR', 'Finance', 'Manager'];

  readonly employeeForm = this.fb.group({
    employeeName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    department: ['', Validators.required],
    salary: [null as number | null, [Validators.required, Validators.min(1)]],
    joiningDate: [null as Date | null, Validators.required]
  });

  ngOnInit(): void {
    if (this.dialogData?.departments?.length) {
      this.departments = this.dialogData.departments;
    }
    this.isEditMode = this.dialogData?.mode === 'edit';

    if (this.isEditMode && this.dialogData?.employee) {
      this.patchEmployee(this.dialogData.employee);
    }
  }

  // Direct accessor to avoid repetitive template syntax
  get f() {
    return this.employeeForm.controls;
  }

  private patchEmployee(employee: Employee): void {
    this.employeeForm.patchValue({
      employeeName: employee.employeeName,
      email: employee.email,
      department: employee.department,
      salary: employee.salary,
      joiningDate: employee.joiningDate ? this.parseLocalDate(employee.joiningDate) : null
    });
  }

  private parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const formValue = this.employeeForm.getRawValue();
    const payload: Partial<Employee> = {
      employeeName: formValue.employeeName.trim(),
      email: formValue.email.trim(),
      department: formValue.department,
      salary: Number(formValue.salary),
      joiningDate: formValue.joiningDate ? this.formatDate(formValue.joiningDate) : undefined
    };

    this.dialogRef.close(payload);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}