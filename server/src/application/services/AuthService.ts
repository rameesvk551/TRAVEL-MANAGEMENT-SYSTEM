import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../domain/entities/User.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { ITenantRepository } from '../../domain/interfaces/ITenantRepository.js';
import { config } from '../../config/index.js';
import { UnauthorizedError, ValidationError, NotFoundError } from '../../shared/errors/index.js';

export interface RegisterDTO {
    email: string;
    password: string;
    name: string;
    tenantSlug: string;
}

export interface LoginDTO {
    email: string;
    password: string;
    tenantSlug: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    token: string;
    expiresIn: string;
}

interface JwtPayload {
    userId: string;
    tenantId: string;
    role: string;
}

/**
 * Authentication service - handles login, register, token verification.
 */
export class AuthService {
    constructor(
        private userRepository: IUserRepository,
        private tenantRepository: ITenantRepository
    ) { }

    async register(dto: RegisterDTO): Promise<AuthResponse> {
        // Find tenant
        const tenant = await this.tenantRepository.findBySlug(dto.tenantSlug);
        if (!tenant) {
            throw new NotFoundError('Tenant', dto.tenantSlug);
        }

        // Check if user exists
        const existing = await this.userRepository.findByEmail(dto.email, tenant.id);
        if (existing) {
            throw new ValidationError('User with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = User.create({
            tenantId: tenant.id,
            email: dto.email,
            passwordHash,
            name: dto.name,
            role: 'staff', // Default role
        });

        const saved = await this.userRepository.save(user);
        const token = this.generateToken(saved);

        return this.buildAuthResponse(saved, token);
    }

    async login(dto: LoginDTO): Promise<AuthResponse> {
        // Find tenant
        const tenant = await this.tenantRepository.findBySlug(dto.tenantSlug);
        if (!tenant) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Find user
        const user = await this.userRepository.findByEmail(dto.email, tenant.id);
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Verify password
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const token = this.generateToken(user);
        return this.buildAuthResponse(user, token);
    }

    async verifyToken(token: string): Promise<JwtPayload> {
        try {
            const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
            return payload;
        } catch {
            throw new UnauthorizedError('Invalid or expired token');
        }
    }

    private generateToken(user: User): string {
        const payload: JwtPayload = {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
        };

        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
        });
    }

    private buildAuthResponse(user: User, token: string): AuthResponse {
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
            expiresIn: config.jwt.expiresIn,
        };
    }
}
