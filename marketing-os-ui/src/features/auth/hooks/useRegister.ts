import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import type { RegisterFormData } from '../types';
import { validateStep, generateSlugFromName } from '../utils/register.utils';
import { INITIAL_FORM_DATA, TOTAL_STEPS } from '../types';

export function useRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM_DATA);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'companyName') {
      setFormData(prev => ({ ...prev, companyName: value, companySlug: generateSlugFromName(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    setError(null);
  };

  const handleNext = () => {
    if (validateStep(step, formData, setError)) {
      setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step, formData, setError)) return;

    if (step < TOTAL_STEPS) {
      setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.register({
        tenantName: formData.companyName,
        userName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        companyCity: formData.companyCity,
      });
      navigate('/login?registered=true');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    step,
    isLoading,
    error,
    formData,
    handleChange,
    handleNext,
    handleBack,
    handleSubmit,
  };
}
