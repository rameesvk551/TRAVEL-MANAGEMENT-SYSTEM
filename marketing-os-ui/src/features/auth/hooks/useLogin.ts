import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../services';
import type { LoginPayload } from '../types';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login: setAuthState } = useAuth();

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(payload);
      const { token, user } = response.data;

      setAuthState(token, user);

      const role = String(user?.role || '').toLowerCase();
      const isSuperAdmin = ['super_admin', 'platform_admin', 'owner'].includes(role);
      navigate(isSuperAdmin ? '/admin' : '/');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { login, loading, error, clearError };
}
