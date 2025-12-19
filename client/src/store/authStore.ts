import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/api';

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    tenantSlug: string;
    isAuthenticated: boolean;

    // Actions
    setAuth: (user: AuthUser, token: string) => void;
    setTenant: (slug: string) => void;
    logout: () => void;
}

/**
 * Auth store - manages authentication state.
 * Persisted to localStorage.
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            tenantSlug: 'demo', // Default tenant
            isAuthenticated: false,

            setAuth: (user, token) => set({
                user,
                token,
                isAuthenticated: true,
            }),

            setTenant: (slug) => set({ tenantSlug: slug }),

            logout: () => set({
                user: null,
                token: null,
                isAuthenticated: false,
            }),
        }),
        {
            name: 'travel-ops-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                tenantSlug: state.tenantSlug,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
