/**
 * Auth module type definitions.
 */

export interface RegisterDTO {
    tenantName: string;
    userName: string;
    email: string;
    password: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface UserPayload {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    tenantName: string;
}

export interface AuthResponse {
    user: UserPayload;
    token: string;
}

export interface TokenPayload {
    userId: string;
    tenantId: string;
    role: string;
}
