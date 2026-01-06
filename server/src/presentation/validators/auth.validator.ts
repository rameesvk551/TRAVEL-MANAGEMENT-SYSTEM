import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    tenantSlug: z.string().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').min(3).max(100),
    companyName: z.string().min(2).max(255),
    companyCity: z.string().min(2).max(255),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
