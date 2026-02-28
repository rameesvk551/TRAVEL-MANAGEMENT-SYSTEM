import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { getConfig } from '../../config/env.js';
import { AppError, UnauthorizedError } from '../../utils/apiError.js';
import { AuthRepository } from './auth.repository.js';
import { sendEmail } from '../email/mailer.js';
import type { BillingOnboardingPort } from '../billing/billing.contracts.js';
import type { RegisterDTO, LoginDTO, AuthResponse, TokenPayload } from './auth.types.js';
import { AUTH } from '../../config/constants.js';

/**
 * Auth service — contains all authentication business logic.
 * DB queries are delegated to AuthRepository.
 */
export class AuthService {
    private config = getConfig();

    constructor(
        private readonly authRepository: AuthRepository,
        private readonly billingOnboardingPort?: BillingOnboardingPort,
        private readonly redisClient?: Redis
    ) { }

    /**
     * Register a new tenant and admin user.
     */
    async register(data: RegisterDTO): Promise<AuthResponse> {
        // 1. Check if user already exists
        const existingUser = await this.authRepository.findUserByEmail(data.email);
        if (existingUser) {
            throw new AppError('User with this email already exists', 409);
        }

        // 2. Create Tenant
        const tenant = await this.authRepository.createTenant({
            name: data.tenantName,
            slug: data.tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            is_active: true,
        });

        // 3. Hash Password
        const salt = await bcrypt.genSalt(AUTH.SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(data.password, salt);

        // 4. Create User
        const user = await this.authRepository.createUser({
            tenant_id: tenant.id,
            email: data.email,
            password_hash: passwordHash,
            name: data.userName,
            role: 'admin',
            is_active: true,
        });

        // 5. Create billing trial if available
        if (this.billingOnboardingPort) {
            try {
                await this.billingOnboardingPort.createTrialForTenant({
                    tenantId: tenant.id,
                    performedByUserId: user.id,
                });
            } catch (error) {
                console.error('Failed to create billing trial during registration:', error);
            }
        }

        // 6. Generate Token
        const token = this.generateToken(user.id, tenant.id, user.role);

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
    }

    /**
     * Login user.
     */
    async login(data: LoginDTO): Promise<AuthResponse> {
        // 1. Find User with tenant
        const user = await this.authRepository.findUserByEmailWithTenant(data.email);
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
        const token = this.generateToken(user.id, user.tenant_id, user.role);

        let tenantName = 'Unknown';
        if (user.tenant) {
            tenantName = user.tenant.name;
        } else {
            const tenant = await this.authRepository.findTenantById(user.tenant_id);
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
    }

    /**
     * Validate JWT Token.
     */
    validateToken(token: string): TokenPayload {
        try {
            const decoded = jwt.verify(token, this.config.jwt.secret) as any;
            return {
                userId: decoded.id,
                tenantId: decoded.tenantId,
                role: decoded.role,
            };
        } catch (error) {
            throw new UnauthorizedError('Invalid token');
        }
    }

    /**
     * Initiate Password Reset.
     */
    async forgotPassword(email: string): Promise<void> {
        const user = await this.authRepository.findUserByEmail(email);
        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`);
            return;
        }

        const resetToken = uuidv4();

        if (this.redisClient) {
            await this.redisClient.setex(`reset_token:${resetToken}`, AUTH.RESET_TOKEN_TTL, user.id);
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
    }

    /**
     * Complete Password Reset.
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        if (!this.redisClient) {
            throw new AppError('Password reset service unavailable', 503);
        }

        const userId = await this.redisClient.get(`reset_token:${token}`);
        if (!userId) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        const salt = await bcrypt.genSalt(AUTH.SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        const user = await this.authRepository.updateUserPassword(userId, passwordHash);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        await this.redisClient.del(`reset_token:${token}`);
    }

    private generateToken(userId: string, tenantId: string, role: string): string {
        return jwt.sign(
            { id: userId, tenantId, role },
            this.config.jwt.secret,
            { expiresIn: this.config.jwt.expiresIn } as jwt.SignOptions
        );
    }
}
