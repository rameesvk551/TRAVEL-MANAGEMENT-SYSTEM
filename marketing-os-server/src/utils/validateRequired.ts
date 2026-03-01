import { AppError } from './apiError.js';

/**
 * Validates that all provided fields have truthy values.
 * Throws an AppError(400) for the first missing field.
 *
 * @example
 *   validateRequired({ email, password });
 *   // throws AppError('email is required', 400) if email is falsy
 */
export const validateRequired = (fields: Record<string, any>): void => {
    for (const [key, value] of Object.entries(fields)) {
        if (!value) {
            throw new AppError(`${key} is required`, 400);
        }
    }
};
