// domain/entities/hrms/RoleAssignment.ts
// Flexible role assignment with context support

export type AssignmentContextType = 'PERMANENT' | 'TEMPORARY' | 'PROJECT';

export interface RoleAssignment {
  id: string;
  tenantId: string;
  
  employeeId: string;
  roleId: string;
  
  // Context
  contextType: AssignmentContextType;
  contextId?: string;  // Trip ID, Project ID, etc.
  
  // Duration
  startDate: Date;
  endDate?: Date;  // Null = permanent
  
  // Delegation
  delegatedBy?: string;
  delegationReason?: string;
  
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export function createRoleAssignment(
  params: Omit<RoleAssignment, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>
): Omit<RoleAssignment, 'id'> {
  return {
    ...params,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function isAssignmentActive(assignment: RoleAssignment): boolean {
  if (!assignment.isActive) return false;
  
  const now = new Date();
  if (assignment.startDate > now) return false;
  if (assignment.endDate && assignment.endDate < now) return false;
  
  return true;
}

export function isTemporary(assignment: RoleAssignment): boolean {
  return assignment.contextType === 'TEMPORARY' || 
         assignment.contextType === 'PROJECT';
}

export function getAssignmentDuration(assignment: RoleAssignment): number | null {
  if (!assignment.endDate) return null;
  
  const diffTime = assignment.endDate.getTime() - assignment.startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
