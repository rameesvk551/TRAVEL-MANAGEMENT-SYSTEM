// application/mappers/hrms/EmployeeMapper.ts
// Maps between Employee domain entity and DTOs

import { Employee, ContactInfo, getDisplayName } from '../../../domain/entities/hrms/Employee';
import {
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  EmployeeResponseDTO,
  EmployeeListItemDTO,
  EMPLOYEE_TYPE_LABELS,
  EMPLOYEE_CATEGORY_LABELS,
  LIFECYCLE_STAGE_LABELS,
} from '../../dtos/hrms/EmployeeDTO';

export class EmployeeMapper {
  static toResponseDTO(
    employee: Employee,
    resolved?: {
      branchName?: string;
      departmentName?: string;
      reportingToName?: string;
      hasActiveTrips?: boolean;
      upcomingTripsCount?: number;
    }
  ): EmployeeResponseDTO {
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
      branchName: resolved?.branchName,
      departmentId: employee.departmentId,
      departmentName: resolved?.departmentName,
      reportingTo: employee.reportingTo,
      reportingToName: resolved?.reportingToName,
      lifecycleStage: employee.lifecycleStage,
      lifecycleStageLabel: LIFECYCLE_STAGE_LABELS[employee.lifecycleStage],
      isActive: employee.isActive,
      joiningDate: employee.joiningDate.toISOString(),
      probationEndDate: employee.probationEndDate?.toISOString(),
      confirmationDate: employee.confirmationDate?.toISOString(),
      tenure: this.calculateTenure(employee.joiningDate),
      contact: employee.contact,
      emergencyContacts: employee.emergencyContacts,
      hasActiveTrips: resolved?.hasActiveTrips || false,
      upcomingTripsCount: resolved?.upcomingTripsCount || 0,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };
  }

  static toListItemDTO(
    employee: Employee,
    resolved?: {
      branchName?: string;
      departmentName?: string;
    }
  ): EmployeeListItemDTO {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      displayName: getDisplayName(employee),
      type: employee.type,
      category: employee.category,
      categoryLabel: EMPLOYEE_CATEGORY_LABELS[employee.category],
      branchName: resolved?.branchName,
      departmentName: resolved?.departmentName,
      lifecycleStage: employee.lifecycleStage,
      isActive: employee.isActive,
      phone: employee.contact.phone,
      email: employee.contact.email,
    };
  }

  static toDomain(
    dto: CreateEmployeeDTO,
    tenantId: string,
    employeeCode: string,
    createdBy: string
  ): Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> {
    return {
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
      isActive: true,
      contact: dto.contact,
      emergencyContacts: dto.emergencyContacts || [],
      attributes: dto.attributes || {},
      createdBy,
    };
  }

  static toUpdateDomain(dto: UpdateEmployeeDTO): Partial<Employee> {
    const result: Partial<Employee> = {};

    if (dto.preferredName !== undefined) result.preferredName = dto.preferredName;
    if (dto.type !== undefined) result.type = dto.type;
    if (dto.category !== undefined) result.category = dto.category;
    if (dto.branchId !== undefined) result.branchId = dto.branchId;
    if (dto.departmentId !== undefined) result.departmentId = dto.departmentId;
    if (dto.reportingTo !== undefined) result.reportingTo = dto.reportingTo;
    if (dto.costCenterId !== undefined) result.costCenterId = dto.costCenterId;
    if (dto.probationEndDate !== undefined) {
      result.probationEndDate = dto.probationEndDate ? new Date(dto.probationEndDate) : undefined;
    }
    if (dto.confirmationDate !== undefined) {
      result.confirmationDate = dto.confirmationDate ? new Date(dto.confirmationDate) : undefined;
    }
    if (dto.contact !== undefined) {
      // Contact is Partial<ContactInfo> in DTO, needs to be merged with existing
      result.contact = dto.contact as ContactInfo;
    }
    if (dto.emergencyContacts !== undefined) result.emergencyContacts = dto.emergencyContacts;
    if (dto.attributes !== undefined) result.attributes = dto.attributes;

    result.updatedAt = new Date();
    return result;
  }

  private static calculateTenure(joiningDate: Date): string {
    const now = new Date();
    const years = now.getFullYear() - joiningDate.getFullYear();
    const months = now.getMonth() - joiningDate.getMonth();
    
    const totalMonths = years * 12 + months;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;

    if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`;
    if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`;
    return `${y}y ${m}m`;
  }
}
