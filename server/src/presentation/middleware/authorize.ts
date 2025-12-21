// presentation/middleware/authorize.ts
// Permission-based authorization middleware

import { Request, Response, NextFunction } from 'express';

// Role hierarchy with default permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['*'],  // All permissions
  admin: [
    'employee:*', 'attendance:*', 'leave:*', 'payroll:*', 'trip:*',
    'settings:read', 'reports:*'
  ],
  manager: [
    'employee:read', 'employee:update',
    'attendance:read', 'attendance:create', 'attendance:approve',
    'leave:read', 'leave:approve',
    'payroll:read',
    'trip:read', 'trip:assign',
    'reports:read'
  ],
  staff: [
    'employee:read:self',
    'attendance:read:self', 'attendance:create:self',
    'leave:read:self', 'leave:create:self',
    'payroll:read:self',
    'trip:read:self'
  ],
  viewer: [
    'employee:read:self',
    'attendance:read:self',
    'leave:read:self',
    'payroll:read:self'
  ]
};

/**
 * Check if user has a specific permission
 */
function hasPermission(
  userPermissions: string[], 
  userRole: string, 
  requiredPermission: string
): boolean {
  // Get role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  const allPermissions = [...userPermissions, ...rolePermissions];

  // Check for wildcard permissions
  if (allPermissions.includes('*')) return true;
  
  // Check for exact match
  if (allPermissions.includes(requiredPermission)) return true;

  // Check for module wildcard (e.g., 'employee:*' covers 'employee:read')
  const [module, action] = requiredPermission.split(':');
  if (allPermissions.includes(`${module}:*`)) return true;

  // Check for self-permissions (e.g., 'employee:read:self')
  // These are typically validated at the service level
  if (allPermissions.includes(`${module}:${action}:self`)) return true;

  return false;
}

/**
 * Authorization middleware factory
 * @param permission Required permission string (e.g., 'employee:create')
 */
export function authorize(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { role, permissions } = req.user;

    if (!hasPermission(permissions, role, permission)) {
      res.status(403).json({ 
        error: 'Access denied',
        required: permission 
      });
      return;
    }

    next();
  };
}

/**
 * Role-based authorization middleware
 * @param minRole Minimum role required
 */
export function requireRole(minRole: 'viewer' | 'staff' | 'manager' | 'admin' | 'owner') {
  const roleHierarchy: Record<string, number> = {
    viewer: 1,
    staff: 2,
    manager: 3,
    admin: 4,
    owner: 5,
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userLevel = roleHierarchy[req.user.role] ?? 0;
    const requiredLevel = roleHierarchy[minRole];

    if (userLevel < requiredLevel) {
      res.status(403).json({ 
        error: `Requires ${minRole} role or higher`,
        currentRole: req.user.role
      });
      return;
    }

    next();
  };
}
