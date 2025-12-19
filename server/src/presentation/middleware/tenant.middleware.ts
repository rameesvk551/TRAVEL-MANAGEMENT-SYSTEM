import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../../application/services/TenantService.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import { config } from '../../config/index.js';

/**
 * Tenant middleware - extracts and validates tenant from request.
 * Attaches tenant info to request context.
 */
export function createTenantMiddleware(tenantService: TenantService) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            // Get tenant from header, subdomain, or use default
            const tenantSlug =
                req.headers['x-tenant-id'] as string ||
                extractSubdomain(req.hostname) ||
                config.defaultTenantSlug;

            if (!tenantSlug) {
                throw new UnauthorizedError('Tenant not identified');
            }

            const tenant = await tenantService.getBySlug(tenantSlug);

            if (!tenant.isActive) {
                throw new UnauthorizedError('Tenant is inactive');
            }

            // Attach to request
            req.context = {
                tenantId: tenant.id,
                tenant,
            };

            next();
        } catch (error) {
            next(error);
        }
    };
}

function extractSubdomain(hostname: string): string | null {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        return parts[0];
    }
    return null;
}
