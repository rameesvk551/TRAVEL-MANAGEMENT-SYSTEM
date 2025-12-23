import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../../shared/errors/index.js';

/**
 * Creates a validation middleware for request body.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};
                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errors[path]) errors[path] = [];
                    errors[path].push(err.message);
                });
                next(new ValidationError('Validation failed', errors));
            } else {
                next(error);
            }
        }
    };
}

/**
 * Creates a validation middleware for query parameters.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as typeof req.query;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};
                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errors[path]) errors[path] = [];
                    errors[path].push(err.message);
                });
                next(new ValidationError('Invalid query parameters', errors));
            } else {
                next(error);
            }
        }
    };
}

/**
 * Generic validation middleware that validates request body, query, and params
 * against a schema that contains body, query, and/or params keys.
 */
export function validate<T>(schema: ZodSchema<T>) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const result = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            
            // Update req with parsed values
            if (result.body) req.body = result.body;
            if (result.query) req.query = result.query;
            if (result.params) req.params = result.params;
            
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};
                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errors[path]) errors[path] = [];
                    errors[path].push(err.message);
                });
                next(new ValidationError('Validation failed', errors));
            } else {
                next(error);
            }
        }
    };
}
