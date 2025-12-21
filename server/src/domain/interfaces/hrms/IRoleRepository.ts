// domain/interfaces/hrms/IRoleRepository.ts
import { Role, RoleScope } from '../../entities/hrms/Role';
import { RoleAssignment } from '../../entities/hrms/RoleAssignment';

export interface RoleFilters {
  scope?: RoleScope;
  scopeId?: string;
  isSystemRole?: boolean;
  isActive?: boolean;
}

export interface IHrmsRoleRepository {
  // Roles
  findRoleById(id: string, tenantId: string): Promise<Role | null>;
  findRoleByCode(code: string, tenantId: string): Promise<Role | null>;
  findAllRoles(tenantId: string, filters?: RoleFilters): Promise<Role[]>;
  createRole(role: Omit<Role, 'id'>): Promise<Role>;
  updateRole(id: string, role: Partial<Role>): Promise<Role>;
  deleteRole(id: string, tenantId: string): Promise<void>;
  
  // Role Assignments
  findAssignmentById(id: string, tenantId: string): Promise<RoleAssignment | null>;
  
  findAssignmentsByEmployee(
    employeeId: string, 
    tenantId: string
  ): Promise<RoleAssignment[]>;
  
  findActiveAssignmentsByEmployee(
    employeeId: string, 
    tenantId: string
  ): Promise<RoleAssignment[]>;
  
  findAssignmentsByRole(
    roleId: string, 
    tenantId: string
  ): Promise<RoleAssignment[]>;
  
  createAssignment(assignment: Omit<RoleAssignment, 'id'>): Promise<RoleAssignment>;
  updateAssignment(id: string, assignment: Partial<RoleAssignment>): Promise<RoleAssignment>;
  deleteAssignment(id: string, tenantId: string): Promise<void>;
  
  // Project/Trip specific
  findAssignmentsByContext(
    contextType: string, 
    contextId: string, 
    tenantId: string
  ): Promise<RoleAssignment[]>;
  
  // Expire temporary assignments
  expireTemporaryAssignments(tenantId: string): Promise<number>;
}
