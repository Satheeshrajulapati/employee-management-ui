import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
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
import { EmployeeDialogData } from '../../../interfaces/employee-dialog-data.interface';
import { Employee } from '../models/employee.model';

@Component({
  selector: 'app-employee-form',

  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule
  ],

  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EmployeeFormComponent>);
  private dialogData = inject<EmployeeDialogData>(MAT_DIALOG_DATA);

  isEditMode = false;

  employeeForm = this.fb.group({
    employeeName: ['', Validators.required],

    email: ['', [Validators.required, Validators.email]],

    department: ['', Validators.required],

    salary: [null as number | null, [Validators.required, Validators.min(1)]],

    joiningDate: [null as Date | null, Validators.required],
  });

  constructor() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.isEditMode = this.dialogData?.mode === 'edit';
    if (
      this.isEditMode && this.dialogData?.employee
    ) {
      this.patchEmployee(this.dialogData.employee);
    }
  }

  private patchEmployee(employee: Employee): void {
    this.employeeForm.patchValue({
      employeeName: employee.employeeName,
      email: employee.email,
      department: employee.department,
      salary: employee.salary,
      joiningDate: new Date(employee.joiningDate)
    });
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
    const employee = {
      employeeName: formValue.employeeName!,
      email: formValue.email!,
      department: formValue.department!,
      salary: Number(formValue.salary),
      joiningDate: formValue.joiningDate ? this.formatDate(formValue.joiningDate) : null
    };
    console.log('New Employee Data:', employee);
    this.dialogRef.close(employee);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}