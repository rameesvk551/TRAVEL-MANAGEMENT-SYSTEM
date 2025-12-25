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
  // Company info
  companyName: string;
  companySlug: string;
  companyDescription: string;
  companyWebsite: string;
  companyPhone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface PasswordStrength {
  strength: number;
  label: string;
  color: string;
}

export interface StepProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onNext: () => void;
  onBack?: () => void;
  error?: string | null;
}

export interface Step3Props extends StepProps {
  onSubmit: (e: React.FormEvent) => void;
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
  companyDescription: '',
  companyWebsite: '',
  companyPhone: '',
  street: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
};

export const TOTAL_STEPS = 3;
