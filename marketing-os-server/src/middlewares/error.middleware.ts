import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

/**
 * Global error handling middleware.
 * Must be registered LAST in the middleware chain.
 */
export const errorMiddleware = (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Handle known operational errors
    if (error instanceof AppError) {
        const response: any = {
            status: 'error',
            code: error.code,
            message: error.message,
        };

        // Attach field-level validation errors if present
        if (error instanceof ValidationError && error.errors) {
            response.errors = error.errors;
        }

        if (error.statusCode >= 500) {
            logger.error(error.message, { stack: error.stack });
        }

        return res.status(error.statusCode).json(response);
    }

    // Handle unknown errors
    logger.error('Unhandled error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        ...(error as any).original && { original: (error as any).original.message },
        ...(error as any).sql && { sql: (error as any).sql },
    });

    return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
    });
};
