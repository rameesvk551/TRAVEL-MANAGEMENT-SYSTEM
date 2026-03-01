import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from '../../config/redis.js';
import { getConfig } from '../../config/env.js';
import { AppError, UnauthorizedError } from '../../utils/apiError.js';
import * as authRepository from './auth.repository.js';
// Email module removed — stub until mailer is re-integrated
const sendEmail = async (to: string, subject: string, html: string) => {
    console.log(`[EMAIL STUB] To: ${to}, Subject: ${subject}`);
};
import type { RegisterDTO, LoginDTO, AuthResponse, TokenPayload } from './auth.types.js';
import { AUTH } from '../../config/constants.js';

// Since the class had optional billingOnboardingPort injected, we can either
// omit it in the functional approach or provide a way to inject it if strictly needed.
// For now, I'll omit the billing step or leave a TODO/import if required.
// If needed, import from billing service directly.
// import { billingService } from '../billing/index.js';

export const register = async (data: RegisterDTO): Promise<AuthResponse> => {
    const config = getConfig();

    // 1. Check if user already exists
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
        throw new AppError('User with this email already exists', 409);
    }

    // 2. Create Tenant
    const slug = data.tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Check if tenant with this slug already exists
    const existingTenant = await authRepository.findTenantBySlug(slug);
    if (existingTenant) {
        throw new AppError('A tenant with this name already exists', 409);
    }

    const tenant = await authRepository.createTenant({
        name: data.tenantName,
        slug,
        is_active: true,
    });

    // 3. Hash Password
    const salt = await bcrypt.genSalt(AUTH.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // 4. Create User
    const user = await authRepository.createUser({
        tenant_id: tenant.id,
        email: data.email,
        password_hash: passwordHash,
        name: data.userName,
        role: 'admin',
        is_active: true,
    });

    // 5. Create billing trial if available (Placeholder to adapt billing integration if accessed globally)
    // if (billingService) {
    //     try {
    //         await billingService.createTrialForTenant({
    //             tenantId: tenant.id,
    //             performedByUserId: user.id,
    //         });
    //     } catch (error) {
    //         console.error('Failed to create billing trial during registration:', error);
    //     }
    // }

    // 6. Generate Token
    const token = generateToken(user.id, tenant.id, user.role);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: tenant.id,
            tenantName: tenant.name,
        },
        token,
    };
};

export const login = async (data: LoginDTO): Promise<AuthResponse> => {
    // 1. Find User with tenant
    const user = await authRepository.findUserByEmailWithTenant(data.email);
    if (!user) {
        throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Validate Password
    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Check if active
    if (!user.is_active) {
        throw new UnauthorizedError('Account is disabled');
    }

    // 4. Generate Token
    const token = generateToken(user.id, user.tenant_id, user.role);

    let tenantName = 'Unknown';
    if (user.tenant) {
        tenantName = user.tenant.name;
    } else {
        const tenant = await authRepository.findTenantById(user.tenant_id);
        if (tenant) tenantName = tenant.name;
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenant_id,
            tenantName,
        },
        token,
    };
};

export const validateToken = (token: string): TokenPayload => {
    const config = getConfig();
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        return {
            userId: decoded.id,
            tenantId: decoded.tenantId,
            role: decoded.role,
        };
    } catch (error) {
        throw new UnauthorizedError('Invalid token');
    }
};

export const forgotPassword = async (email: string): Promise<void> => {
    const redisClient = getRedisClient();
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return;
    }

    const resetToken = uuidv4();

    if (redisClient) {
        await redisClient.setex(`reset_token:${resetToken}`, AUTH.RESET_TOKEN_TTL, user.id);
    } else {
        throw new AppError('Password reset service unavailable', 503);
    }

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const html = `
        <h3>Password Reset Request</h3>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset it (valid for 15 minutes):</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail(user.email, 'Password Reset Request', html);
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    const redisClient = getRedisClient();
    if (!redisClient) {
        throw new AppError('Password reset service unavailable', 503);
    }

    const userId = await redisClient.get(`reset_token:${token}`);
    if (!userId) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    const salt = await bcrypt.genSalt(AUTH.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const user = await authRepository.updateUserPassword(userId, passwordHash);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    await redisClient.del(`reset_token:${token}`);
};

const generateToken = (userId: string, tenantId: string, role: string): string => {
    const config = getConfig();
    return jwt.sign(
        { id: userId, tenantId, role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );
};
