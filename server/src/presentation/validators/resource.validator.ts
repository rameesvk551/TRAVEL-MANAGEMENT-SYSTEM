import { z } from 'zod';

const resourceTypes = ['ROOM', 'TOUR', 'TREK', 'ACTIVITY', 'VEHICLE', 'EQUIPMENT'] as const;

export const createResourceSchema = z.object({
    type: z.enum(resourceTypes),
    name: z.string().min(1).max(255),
    description: z.string().max(2000).optional(),
    capacity: z.number().int().positive().optional(),
    basePrice: z.number().nonnegative().optional(),
    currency: z.string().length(3).optional(),
    attributes: z.record(z.unknown()).optional(),
});

export const updateResourceSchema = z.object({
    type: z.enum(resourceTypes).optional(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional(),
    capacity: z.number().int().positive().optional(),
    basePrice: z.number().nonnegative().optional(),
    currency: z.string().length(3).optional(),
    attributes: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
});

export const resourceQuerySchema = z.object({
    type: z.enum(resourceTypes).optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
    search: z.string().max(100).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
});
