import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services';

export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const resetPassword = async (password: string) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword({ token, newPassword: password });
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { resetPassword, loading, error, token, clearError };
}
