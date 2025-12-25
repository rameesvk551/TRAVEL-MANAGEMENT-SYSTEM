/**
 * Register page utility functions
 */

import type { FormData, PasswordStrength } from './types';

export const getPasswordStrength = (password: string): PasswordStrength => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
  if (strength <= 3) return { strength, label: 'Medium', color: 'bg-yellow-500' };
  if (strength <= 4) return { strength, label: 'Strong', color: 'bg-green-500' };
  return { strength, label: 'Very Strong', color: 'bg-green-600' };
};

export const generateSlugFromName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export const validateStep = (
  step: number,
  formData: FormData,
  setError: (error: string | null) => void
): boolean => {
  switch (step) {
    case 1:
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Please fill in all required fields');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
      return true;
    case 2:
      if (!formData.password || !formData.confirmPassword) {
        setError('Please enter and confirm your password');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!formData.acceptTerms) {
        setError('Please accept the terms and conditions');
        return false;
      }
      return true;
    case 3:
      if (!formData.companyName || !formData.companySlug) {
        setError('Please fill in the company name');
        return false;
      }
      if (!/^[a-z0-9-]+$/.test(formData.companySlug)) {
        setError('Company slug can only contain lowercase letters, numbers, and hyphens');
        return false;
      }
      return true;
    default:
      return true;
  }
};
