// ── Auth Feature Types ──

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  tenantName: string;
  userName: string;
  email: string;
  password: string;
  companyCity: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

export interface LoginResponse {
  data: {
    token: string;
    user: AuthUser;
  };
}

export interface ApiResponse<T = unknown> {
  message?: string;
  data: T;
}

// ── Registration Form Types ──

export interface RegisterFormData {
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
  formData: RegisterFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onNext?: () => void;
  onBack?: () => void;
  error?: string | null;
}

export interface StepCompanyProps extends StepProps {
  isLoading: boolean;
}

export const INITIAL_FORM_DATA: RegisterFormData = {
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
