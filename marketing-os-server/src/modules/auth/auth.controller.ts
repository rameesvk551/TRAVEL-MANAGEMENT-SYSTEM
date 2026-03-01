import { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/apiError.js';
import { validateRequired } from '../../utils/validateRequired.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { tenantName, userName, email, password } = req.body;

    validateRequired({ tenantName, userName, email, password });

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

    validateRequired({ email, password });

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
    validateRequired({ email });

    await authService.forgotPassword(email);

    ApiResponse.success(res, null, 'If the email exists, a password reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    validateRequired({ token, newPassword });

    await authService.resetPassword(token, newPassword);

    ApiResponse.success(res, null, 'Password reset successful');
});
