import { Employee } from '../core/interfaces/employee.interface';

export interface EmployeeDialogData {
  mode: 'add' | 'edit';
  employee?: Employee;
}