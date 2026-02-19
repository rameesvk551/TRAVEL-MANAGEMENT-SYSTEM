/**
 * RegisterPage.tsx
 * Company registration with multi-step flow for ERP system
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, AlertCircle } from 'lucide-react';
// import { authApi } from '@/api/authApi'; // TODO: Point to correct auth api or use fetch

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
            // Direct fetch call for now since we haven't set up the api client fully in UI
            const response = await fetch('http://localhost:5000/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantName: formData.companyName,
                    userName: formData.firstName + ' ' + formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    // Add other fields if backend supports them or ignore
                    companyCity: formData.companyCity
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            navigate('/login?registered=true');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left side - Form */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
                <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Marketing OS</span>
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
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Form Steps */}
                    <form onSubmit={handleSubmit}>
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
                    </form>

                    {/* Sign in link */}
                    <p className="mt-8 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right side - Image/Branding */}
            <BrandingPanel />
        </div>
    );
};

export default RegisterPage;
