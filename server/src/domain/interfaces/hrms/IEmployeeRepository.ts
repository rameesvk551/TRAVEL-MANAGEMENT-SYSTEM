// domain/interfaces/hrms/IEmployeeRepository.ts
import { 
  Employee, 
  EmployeeType, 
  EmployeeCategory, 
  LifecycleStage 
} from '../../entities/hrms/Employee';

export interface EmployeeFilters {
  search?: string;
  type?: EmployeeType;
  category?: EmployeeCategory;
  lifecycleStage?: LifecycleStage;
  branchId?: string;
  departmentId?: string;
  reportingTo?: string;
  isActive?: boolean;
  joiningDateFrom?: Date;
  joiningDateTo?: Date;
}

export interface EmployeePagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IEmployeeRepository {
  // CRUD
  findById(id: string, tenantId: string): Promise<Employee | null>;
  findByCode(employeeCode: string, tenantId: string): Promise<Employee | null>;
  findByEmail(email: string, tenantId: string): Promise<Employee | null>;
  
  findAll(
    tenantId: string, 
    filters: EmployeeFilters, 
    pagination: EmployeePagination
  ): Promise<PaginatedResult<Employee>>;
  
  create(employee: Omit<Employee, 'id'>): Promise<Employee>;
  update(id: string, employee: Partial<Employee>): Promise<Employee>;
  delete(id: string, tenantId: string): Promise<void>;
  
  // Specialized queries
  findByBranch(branchId: string, tenantId: string): Promise<Employee[]>;
  findByDepartment(departmentId: string, tenantId: string): Promise<Employee[]>;
  findByReportingTo(managerId: string, tenantId: string): Promise<Employee[]>;
  
  // Availability
  findAvailable(
    tenantId: string, 
    startDate: Date, 
    endDate: Date,
    skills?: string[]
  ): Promise<Employee[]>;
  
  // Counts
  countByTenant(tenantId: string): Promise<number>;
  countByLifecycleStage(tenantId: string): Promise<Record<LifecycleStage, number>>;
  
  // Code generation
  generateEmployeeCode(tenantId: string): Promise<string>;
}
