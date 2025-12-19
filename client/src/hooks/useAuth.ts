import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginInput, type RegisterInput } from '@/api';
import { useAuthStore } from '@/store';

/**
 * Hook for login mutation.
 */
export function useLogin() {
    const navigate = useNavigate();
    const { setAuth, tenantSlug } = useAuthStore();

    return useMutation({
        mutationFn: (data: Omit<LoginInput, 'tenantSlug'>) =>
            authApi.login({ ...data, tenantSlug }),
        onSuccess: (response) => {
            setAuth(response.user, response.token);
            navigate('/');
        },
    });
}

/**
 * Hook for register mutation.
 */
export function useRegister() {
    const navigate = useNavigate();
    const { setAuth, tenantSlug } = useAuthStore();

    return useMutation({
        mutationFn: (data: Omit<RegisterInput, 'tenantSlug'>) =>
            authApi.register({ ...data, tenantSlug }),
        onSuccess: (response) => {
            setAuth(response.user, response.token);
            navigate('/');
        },
    });
}

/**
 * Hook for logout.
 */
export function useLogout() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    return () => {
        logout();
        navigate('/login');
    };
}
