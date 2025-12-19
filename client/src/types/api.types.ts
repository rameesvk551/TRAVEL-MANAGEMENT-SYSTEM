/**
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

/**
 * Paginated API response.
 */
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Query parameters for list endpoints.
 */
export interface ListParams {
    page?: number;
    limit?: number;
    search?: string;
}
