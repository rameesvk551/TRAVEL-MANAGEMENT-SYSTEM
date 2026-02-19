import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
