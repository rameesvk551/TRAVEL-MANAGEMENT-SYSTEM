import client from '../../../api/client';
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ApiResponse,
} from '../types';

const AUTH_BASE = '/auth';

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await client.post<LoginResponse>(`${AUTH_BASE}/login`, payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<ApiResponse> {
    const { data } = await client.post<ApiResponse>(`${AUTH_BASE}/register`, payload);
    return data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse> {
    const { data } = await client.post<ApiResponse>(`${AUTH_BASE}/forgot-password`, payload);
    return data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse> {
    const { data } = await client.post<ApiResponse>(`${AUTH_BASE}/reset-password`, payload);
    return data;
  },
};
