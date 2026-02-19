import { Response } from 'express';

/**
 * Standardized API response format for all endpoints.
 */
export class ApiResponse {
    /**
     * Send a success response.
     */
    static success<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200) {
        return res.status(statusCode).json({
            status: 'success',
            message,
            data,
        });
    }

    /**
     * Send a created response (201).
     */
    static created<T>(res: Response, data: T, message: string = 'Created successfully') {
        return res.status(201).json({
            status: 'success',
            message,
            data,
        });
    }

    /**
     * Send a paginated response.
     */
    static paginated<T>(
        res: Response,
        data: T[],
        pagination: { page: number; limit: number; total: number },
        message: string = 'Success'
    ) {
        return res.status(200).json({
            status: 'success',
            message,
            data,
            pagination: {
                ...pagination,
                totalPages: Math.ceil(pagination.total / pagination.limit),
            },
        });
    }

    /**
     * Send a no-content response (204).
     */
    static noContent(res: Response) {
        return res.status(204).send();
    }

    /**
     * Send an error response.
     */
    static error(
        res: Response,
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR'
    ) {
        return res.status(statusCode).json({
            status: 'error',
            code,
            message,
        });
    }
}
