import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/AuthService.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import { UserRepository } from '../../infrastructure/repositories/UserRepository.js';

/**
 * Auth middleware - validates JWT token and attaches user to request.
 */
export function createAuthMiddleware(authService: AuthService, userRepository: UserRepository) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader?.startsWith('Bearer ')) {
                throw new UnauthorizedError('No token provided');
            }

            const token = authHeader.substring(7);
            const payload = await authService.verifyToken(token);

            // Load user
            const user = await userRepository.findById(payload.userId, payload.tenantId);
            if (!user) {
                throw new UnauthorizedError('User not found');
            }

            // Attach to request context (including tenantId from JWT payload)
            req.context = {
                ...req.context,
                userId: user.id,
                userRole: user.role,
                tenantId: payload.tenantId,
            };

            // Also set tenantId directly for backward compatibility
            (req as any).tenantId = payload.tenantId;

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Role-based access control middleware.
 * Requires user to have at least the specified role level.
 */
export function requireRole(minRole: 'viewer' | 'staff' | 'manager' | 'admin' | 'owner') {
    const roleHierarchy: Record<string, number> = {
        viewer: 1,
        staff: 2,
        manager: 3,
        admin: 4,
        owner: 5,
    };

    return (req: Request, _res: Response, next: NextFunction): void => {
        const userRole = req.context?.userRole;

        if (!userRole) {
            next(new UnauthorizedError('Authentication required'));
            return;
        }

        const userLevel = roleHierarchy[userRole] ?? 0;
        const requiredLevel = roleHierarchy[minRole];

        if (userLevel < requiredLevel) {
            next(new UnauthorizedError(`Requires ${minRole} role or higher`));
            return;
        }

        next();
    };
}
