import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

/**
 * Tenant context middleware.
 * Extracts tenantId from auth user or header and attaches to request context.
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        let tenantId = req.headers['x-tenant-id'] as string;

        // If authenticated, use the user's tenant
        if ((req as any).user && (req as any).user.tenantId) {
            tenantId = (req as any).user.tenantId;
        }

        if (!tenantId) {
            if (config.server.nodeEnv === 'development') {
                tenantId = config.defaultTenantSlug || 'default';
            }
        }

        if (!tenantId) {
            req.context = { tenantId: '' };
            return next();
        }

        req.context = {
            tenantId,
            userId: (req as any).user?.id,
            roles: (req as any).user?.roles,
        };

        next();
    } catch (error) {
        console.error('Tenant Middleware Error:', error);
        next();
    }
};
