import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';

/**
 * Protected route wrapper - redirects to login if not authenticated.
 */
export function ProtectedRoute() {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

/**
 * Public route wrapper - redirects to dashboard if already authenticated.
 */
export function PublicRoute() {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
