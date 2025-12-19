import { apiClient } from './client';

export interface LoginInput {
    email: string;
    password: string;
    tenantSlug: string;
}

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
    tenantSlug: string;
}

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface AuthResponse {
    user: AuthUser;
    token: string;
    expiresIn: string;
}

/**
 * Auth API client - handles login and register HTTP calls.
 */
export const authApi = {
    async login(data: LoginInput): Promise<AuthResponse> {
        const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
            '/auth/login',
            data
        );
        return response.data.data;
    },

    async register(data: RegisterInput): Promise<AuthResponse> {
        const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
            '/auth/register',
            data
        );
        return response.data.data;
    },

    async me(): Promise<{ userId: string; tenantId: string; role: string }> {
        const response = await apiClient.get<{ success: boolean; data: { userId: string; tenantId: string; role: string } }>(
            '/auth/me'
        );
        return response.data.data;
    },
};
