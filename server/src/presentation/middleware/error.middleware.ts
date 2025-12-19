import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/index.js';
import { isDevelopment } from '../../config/index.js';

interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

/**
 * Global error handling middleware.
 * Converts all errors to consistent JSON responses.
 */
export function errorMiddleware(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('Error:', err);

    if (err instanceof AppError) {
        const response: ErrorResponse = {
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        };

        if ('errors' in err) {
            response.error.details = (err as { errors: unknown }).errors;
        }

        res.status(err.statusCode).json(response);
        return;
    }

    // Unknown errors
    const response: ErrorResponse = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: isDevelopment ? err.message : 'Internal server error',
        },
    };

    if (isDevelopment) {
        response.error.details = { stack: err.stack };
    }

    res.status(500).json(response);
}
