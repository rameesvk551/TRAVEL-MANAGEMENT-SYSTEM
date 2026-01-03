/**
 * RegisterPage.tsx
 * Company registration with multi-step flow for ERP system
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, AlertCircle } from 'lucide-react';
import { authApi } from '@/api/authApi';

import type { FormData } from './register/types';
import { INITIAL_FORM_DATA, TOTAL_STEPS } from './register/types';
import { validateStep, generateSlugFromName } from './register/utils';
import { ProgressIndicator } from './register/ProgressIndicator';
import { StepAdminInfo } from './register/StepAdminInfo';
import { StepSecurity } from './register/StepSecurity';
import { StepCompany } from './register/StepCompany';
import { BrandingPanel } from './register/BrandingPanel';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'companyName') {
      setFormData(prev => ({
        ...prev,
        companyName: value,
        companySlug: generateSlugFromName(value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
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
      await authApi.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        tenantSlug: formData.companySlug,
        companyName: formData.companyName,
        companyCity: formData.companyCity,
      });

      navigate('/login?registered=true');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TravelERP</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register your company</h1>
            <p className="text-gray-600">Create your admin account and company space in minutes</p>
          </div>

          {/* Progress indicator */}
          <ProgressIndicator currentStep={step} />

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Form Steps */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <StepAdminInfo
                  formData={formData}
                  onChange={handleChange}
                  onNext={handleNext}
                />
              )}

              {step === 2 && (
                <StepSecurity
                  formData={formData}
                  onChange={handleChange}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {step === 3 && (
                <StepCompany
                  formData={formData}
                  onChange={handleChange}
                  onBack={handleBack}
                  isLoading={isLoading}
                />
              )}
            </AnimatePresence>
          </form>

          {/* Sign in link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-600 font-semibold">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image/Branding */}
      <BrandingPanel />
    </div>
  );
};

export default RegisterPage;
