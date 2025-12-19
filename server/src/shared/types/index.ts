import { Tenant } from '../../domain/entities/Tenant.js';

/**
 * Request context attached to every authenticated request.
 * Contains tenant and user information extracted by middleware.
 */
export interface RequestContext {
    tenantId: string;
    tenant: Tenant;
    userId?: string;
    userRole?: string;
}

/**
 * Pagination parameters for list endpoints.
 */
export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Parse pagination from query params with defaults.
 */
export function parsePagination(
    query: { page?: string; limit?: string }
): PaginationParams {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

/**
 * Build paginated response.
 */
export function buildPaginatedResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginatedResponse<T> {
    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages: Math.ceil(total / params.limit),
        },
    };
}
