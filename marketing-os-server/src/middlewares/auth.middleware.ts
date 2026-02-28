import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/apiError.js';
import { validateToken } from '../modules/auth/auth.service.js';

// Re-export the Express Request type augmentation
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                tenantId: string;
                role: string;
            };
            context: {
                tenantId: string;
                userId?: string;
                userRole?: string;
                roles?: string[];
                [key: string]: any;
            };
        }
    }
}

/**
 * Auth middleware factory.
 * Validates JWT token and attaches user/context to request.
 */
export const authMiddleware = (billingService?: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                throw new UnauthorizedError('No token provided');
            }

            const token = authHeader.split(' ')[1];
            let decoded: { userId: string; tenantId: string; role: string };

            try {
                decoded = validateToken(token);
            } catch (error) {
                throw new UnauthorizedError('Invalid or expired token');
            }

            // Attach to request
            req.user = {
                id: decoded.userId,
                tenantId: decoded.tenantId,
                role: decoded.role,
            };

            // Maintain compatibility with existing context pattern
            req.context = {
                userId: decoded.userId,
                tenantId: decoded.tenantId,
                userRole: decoded.role,
            };

            // Billing write access check
            if (billingService) {
                const decision = await billingService.decideWriteAccess({
                    tenantId: decoded.tenantId,
                    method: req.method,
                    path: req.originalUrl || req.path,
                    role: decoded.role,
                });

                if (!decision.allowed) {
                    res.status(decision.statusCode).json({
                        status: 'error',
                        code: 'BILLING_WRITE_BLOCKED',
                        message: decision.reason || 'Write access blocked due to billing status',
                    });
                    return;
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
