// domain/entities/hrms/Role.ts
// Dynamic role and permission system

export type RoleScope = 'GLOBAL' | 'BRANCH' | 'DEPARTMENT' | 'PROJECT';

export interface Permission {
  resource: string;
  actions: PermissionAction[];
  conditions?: PermissionCondition;
}

export type PermissionAction = 
  | 'read' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'approve' 
  | 'export'
  | 'assign';

export interface PermissionCondition {
  ownOnly?: boolean;
  ownBranchOnly?: boolean;
  ownDepartmentOnly?: boolean;
  ownTeamOnly?: boolean;
}

export interface Role {
  id: string;
  tenantId: string;
  
  code: string;
  name: string;
  description: string;
  
  scope: RoleScope;
  scopeId?: string;
  
  permissions: Permission[];
  
  isSystemRole: boolean;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Pre-defined system roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  HR_MANAGER: 'HR_MANAGER',
  OPS_MANAGER: 'OPS_MANAGER',
  TEAM_LEAD: 'TEAM_LEAD',
  STAFF: 'STAFF',
} as const;

export function createRole(
  params: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>
): Omit<Role, 'id'> {
  return {
    ...params,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function hasPermission(
  role: Role,
  resource: string,
  action: PermissionAction
): boolean {
  const permission = role.permissions.find(p => p.resource === resource);
  if (!permission) return false;
  return permission.actions.includes(action);
}

export function mergePermissions(roles: Role[]): Permission[] {
  const merged = new Map<string, Permission>();
  
  for (const role of roles) {
    for (const perm of role.permissions) {
      const existing = merged.get(perm.resource);
      if (existing) {
        existing.actions = [...new Set([...existing.actions, ...perm.actions])];
      } else {
        merged.set(perm.resource, { ...perm });
      }
    }
  }
  
  return Array.from(merged.values());
}
