/**
 * Register page types
 */

export interface FormData {
    // Admin user info
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    companyName: string;
    companySlug: string;
    companyCity: string;
}

export interface PasswordStrength {
    strength: number;
    label: string;
    color: string;
}

export interface StepProps {
    formData: FormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onNext?: () => void;
    onBack?: () => void;
    error?: string | null;
}

export interface Step3Props extends StepProps {
    isLoading: boolean;
}

export const INITIAL_FORM_DATA: FormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    companyName: '',
    companySlug: '',
    companyCity: '',
};

export const TOTAL_STEPS = 3;
