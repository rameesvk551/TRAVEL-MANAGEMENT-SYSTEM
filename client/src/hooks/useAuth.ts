import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginInput, type RegisterInput } from '@/api';
import { useAuthStore } from '@/store';

/**
 * Hook for login mutation.
 */
export function useLogin() {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();

    return useMutation({
        mutationFn: (data: LoginInput) => authApi.login(data),
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
    const { setAuth } = useAuthStore();

    return useMutation({
        mutationFn: (data: RegisterInput) => authApi.register(data),
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
