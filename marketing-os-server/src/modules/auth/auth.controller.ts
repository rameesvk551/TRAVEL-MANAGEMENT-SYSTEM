import { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/apiError.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { tenantName, userName, email, password } = req.body;

    if (!tenantName || !userName || !email || !password) {
        throw new AppError('Missing required fields', 400);
    }

    const result = await authService.register({
        tenantName,
        userName,
        email,
        password,
    });

    ApiResponse.created(res, result, 'Registration successful');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const result = await authService.login({ email, password });

    ApiResponse.success(res, result, 'Login successful');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    if (!user) {
        throw new AppError('Not authenticated', 401);
    }

    ApiResponse.success(res, { user });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400);

    await authService.forgotPassword(email);

    ApiResponse.success(res, null, 'If the email exists, a password reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) throw new AppError('Token and new password are required', 400);

    await authService.resetPassword(token, newPassword);

    ApiResponse.success(res, null, 'Password reset successful');
});

module.exports = {
    register,
    login,
    me,
    forgotPassword,
    resetPassword
};
