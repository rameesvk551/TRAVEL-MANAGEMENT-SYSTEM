// application/services/hrms/EmployeeService.ts
// Employee business logic

import { 
  Employee, 
  createEmployee, 
  canTransitionTo,
  getDisplayName 
} from '../../../domain/entities/hrms/Employee';
import { createTimelineEvent } from '../../../domain/entities/hrms/EmployeeTimeline';
import { 
  IEmployeeRepository,
  EmployeeFilters,
  EmployeePagination,
  PaginatedResult 
} from '../../../domain/interfaces/hrms/IEmployeeRepository';
import { 
  CreateEmployeeDTO, 
  UpdateEmployeeDTO,
  TransitionLifecycleDTO,
  EmployeeResponseDTO,
  EmployeeListItemDTO,
  EMPLOYEE_TYPE_LABELS,
  EMPLOYEE_CATEGORY_LABELS,
  LIFECYCLE_STAGE_LABELS
} from '../../dtos/hrms/EmployeeDTO';

export class EmployeeService {
  constructor(
    private employeeRepo: IEmployeeRepository
  ) {}

  async getById(
    id: string, 
    tenantId: string
  ): Promise<EmployeeResponseDTO | null> {
    const employee = await this.employeeRepo.findById(id, tenantId);
    if (!employee) return null;
    return this.toResponseDTO(employee);
  }

  async getByCode(
    code: string, 
    tenantId: string
  ): Promise<EmployeeResponseDTO | null> {
    const employee = await this.employeeRepo.findByCode(code, tenantId);
    if (!employee) return null;
    return this.toResponseDTO(employee);
  }

  async list(
    tenantId: string,
    filters: EmployeeFilters,
    pagination: EmployeePagination
  ): Promise<PaginatedResult<EmployeeListItemDTO>> {
    const result = await this.employeeRepo.findAll(tenantId, filters, pagination);
    
    return {
      ...result,
      data: result.data.map(e => this.toListItemDTO(e)),
    };
  }

  async create(
    dto: CreateEmployeeDTO,
    tenantId: string,
    createdBy: string
  ): Promise<EmployeeResponseDTO> {
    // Generate employee code if not provided
    const employeeCode = dto.employeeCode || 
      await this.employeeRepo.generateEmployeeCode(tenantId);

    // Check for duplicate email
    const existing = await this.employeeRepo.findByEmail(
      dto.contact.email, 
      tenantId
    );
    if (existing) {
      throw new Error('Employee with this email already exists');
    }

    const employeeData = createEmployee({
      tenantId,
      employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      preferredName: dto.preferredName,
      type: dto.type,
      category: dto.category,
      branchId: dto.branchId,
      departmentId: dto.departmentId,
      reportingTo: dto.reportingTo,
      costCenterId: dto.costCenterId,
      joiningDate: new Date(dto.joiningDate),
      probationEndDate: dto.probationEndDate ? new Date(dto.probationEndDate) : undefined,
      lifecycleStage: 'PRE_HIRE',
      contact: dto.contact,
      emergencyContacts: dto.emergencyContacts || [],
      attributes: dto.attributes || {},
      createdBy,
    });

    const employee = await this.employeeRepo.create(employeeData);
    
    return this.toResponseDTO(employee);
  }

  async update(
    id: string,
    dto: UpdateEmployeeDTO,
    tenantId: string
  ): Promise<EmployeeResponseDTO> {
    const existing = await this.employeeRepo.findById(id, tenantId);
    if (!existing) {
      throw new Error('Employee not found');
    }

    const updateData: Partial<Employee> = {
      ...dto,
      probationEndDate: dto.probationEndDate ? new Date(dto.probationEndDate) : undefined,
      confirmationDate: dto.confirmationDate ? new Date(dto.confirmationDate) : undefined,
      contact: dto.contact ? { ...existing.contact, ...dto.contact } : existing.contact,
      updatedAt: new Date(),
    };

    const employee = await this.employeeRepo.update(id, updateData);
    return this.toResponseDTO(employee);
  }

  async transitionLifecycle(
    id: string,
    dto: TransitionLifecycleDTO,
    tenantId: string,
    actorId: string
  ): Promise<EmployeeResponseDTO> {
    const employee = await this.employeeRepo.findById(id, tenantId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (!canTransitionTo(employee.lifecycleStage, dto.targetStage)) {
      throw new Error(
        `Cannot transition from ${employee.lifecycleStage} to ${dto.targetStage}`
      );
    }

    const updated = await this.employeeRepo.update(id, {
      lifecycleStage: dto.targetStage,
      isActive: !['RESIGNED', 'TERMINATED', 'ARCHIVED'].includes(dto.targetStage),
      updatedAt: new Date(),
    });

    return this.toResponseDTO(updated);
  }

  async getAvailable(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    skills?: string[]
  ): Promise<EmployeeListItemDTO[]> {
    const employees = await this.employeeRepo.findAvailable(
      tenantId, 
      startDate, 
      endDate, 
      skills
    );
    return employees.map(e => this.toListItemDTO(e));
  }

  async getTeamByManager(
    managerId: string, 
    tenantId: string
  ): Promise<EmployeeListItemDTO[]> {
    const employees = await this.employeeRepo.findByReportingTo(managerId, tenantId);
    return employees.map(e => this.toListItemDTO(e));
  }

  // Mappers
  private toResponseDTO(employee: Employee): EmployeeResponseDTO {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      preferredName: employee.preferredName,
      displayName: getDisplayName(employee),
      type: employee.type,
      typeLabel: EMPLOYEE_TYPE_LABELS[employee.type],
      category: employee.category,
      categoryLabel: EMPLOYEE_CATEGORY_LABELS[employee.category],
      branchId: employee.branchId,
      branchName: undefined, // TODO: Resolve from branch
      departmentId: employee.departmentId,
      departmentName: undefined,
      reportingTo: employee.reportingTo,
      reportingToName: undefined,
      lifecycleStage: employee.lifecycleStage,
      lifecycleStageLabel: LIFECYCLE_STAGE_LABELS[employee.lifecycleStage],
      isActive: employee.isActive,
      joiningDate: employee.joiningDate.toISOString(),
      probationEndDate: employee.probationEndDate?.toISOString(),
      confirmationDate: employee.confirmationDate?.toISOString(),
      tenure: this.calculateTenure(employee.joiningDate),
      contact: employee.contact,
      emergencyContacts: employee.emergencyContacts,
      hasActiveTrips: false, // TODO: Check from trip assignments
      upcomingTripsCount: 0,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };
  }

  private toListItemDTO(employee: Employee): EmployeeListItemDTO {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      displayName: getDisplayName(employee),
      type: employee.type,
      category: employee.category,
      categoryLabel: EMPLOYEE_CATEGORY_LABELS[employee.category],
      branchName: undefined,
      departmentName: undefined,
      lifecycleStage: employee.lifecycleStage,
      isActive: employee.isActive,
      phone: employee.contact.phone,
      email: employee.contact.email,
    };
  }

  private calculateTenure(joiningDate: Date): string {
    const now = new Date();
    const years = now.getFullYear() - joiningDate.getFullYear();
    const months = now.getMonth() - joiningDate.getMonth();
    
    const totalMonths = years * 12 + months;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;

    if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`;
    if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`;
    return `${y} year${y !== 1 ? 's' : ''}, ${m} month${m !== 1 ? 's' : ''}`;
  }
}
