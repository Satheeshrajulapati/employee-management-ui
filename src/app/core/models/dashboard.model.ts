import { Employee } from '../interfaces/employee.interface';

export interface DepartmentStats {
  department: string;
  employeeCount: number;
}

export interface JoiningTrend {
  year: number;
  month: number;
  employeeCount: number;
}

export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  activeUsers: number;
  totalAdmins: number;
  employeesByDepartment: DepartmentStats[];
  joiningTrend: JoiningTrend[];
  recentEmployees: Employee[];
}