import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Zod-based request validation middleware factory.
 * Validates req.body, req.query, and/or req.params against the provided schema.
 *
 * @example
 * router.post('/register', validate(registerSchema), controller.register);
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors: Record<string, string[]> = {};

                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!formattedErrors[path]) {
                        formattedErrors[path] = [];
                    }
                    formattedErrors[path].push(err.message);
                });

                return res.status(400).json({
                    status: 'error',
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    errors: formattedErrors,
                });
            }
            next(error);
        }
    };
};
