import { useState } from 'react';
import { authService } from '../services';

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendResetLink = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      await authService.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { sendResetLink, loading, success, error, clearError };
}
