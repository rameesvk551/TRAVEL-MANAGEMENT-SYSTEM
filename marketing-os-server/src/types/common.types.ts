/**
 * Global type definitions and Express augmentation.
 */

export interface RequestContext {
    tenantId: string;
    userId?: string;
    userRole?: string;
    roles?: string[];
    [key: string]: any;
}

export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}
