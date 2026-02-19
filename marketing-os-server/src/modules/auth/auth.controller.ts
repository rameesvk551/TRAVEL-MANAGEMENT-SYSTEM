import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/apiError.js';

/**
 * Auth controller — handles HTTP request/response only.
 * All business logic is in AuthService.
 */
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    register = asyncHandler(async (req: Request, res: Response) => {
        const { tenantName, userName, email, password } = req.body;

        if (!tenantName || !userName || !email || !password) {
            throw new AppError('Missing required fields', 400);
        }

        const result = await this.authService.register({
            tenantName,
            userName,
            email,
            password,
        });

        ApiResponse.created(res, result, 'Registration successful');
    });

    login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError('Email and password are required', 400);
        }

        const result = await this.authService.login({ email, password });

        ApiResponse.success(res, result, 'Login successful');
    });

    me = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;

        if (!user) {
            throw new AppError('Not authenticated', 401);
        }

        ApiResponse.success(res, { user });
    });

    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;
        if (!email) throw new AppError('Email is required', 400);

        await this.authService.forgotPassword(email);

        ApiResponse.success(res, null, 'If the email exists, a password reset link has been sent.');
    });

    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) throw new AppError('Token and new password are required', 400);

        await this.authService.resetPassword(token, newPassword);

        ApiResponse.success(res, null, 'Password reset successful');
    });
}
