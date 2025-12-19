import axios from 'axios';
import { useAuthStore } from '@/store';

/**
 * Axios instance configured for API requests.
 * Handles tenant and auth header injection.
 */
export const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add tenant and auth headers
apiClient.interceptors.request.use((config) => {
    const { tenantSlug, token } = useAuthStore.getState();

    config.headers['X-Tenant-ID'] = tenantSlug;

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
});

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Logout on 401
        if (error.response?.status === 401) {
            const { logout } = useAuthStore.getState();
            logout();
            window.location.href = '/login';
        }

        if (error.response?.data?.error) {
            const apiError = new Error(error.response.data.error.message);
            (apiError as Error & { code: string }).code = error.response.data.error.code;
            throw apiError;
        }
        throw error;
    }
);
