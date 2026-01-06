import { Router, RequestHandler } from 'express';
import { BookingController } from '../controllers/BookingController.js';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.middleware.js';

const createBookingSchema = z.object({
    body: z.object({
        resourceId: z.string().uuid(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        guestName: z.string().min(1, 'Guest name is required'),
        guestEmail: z.string().email().optional().or(z.literal('')).or(z.null()),
        guestPhone: z.string().optional().or(z.literal('')).or(z.null()),
        guestCount: z.coerce.number().int().min(1),
        baseAmount: z.coerce.number().min(0).default(0),
        taxAmount: z.coerce.number().min(0).default(0),
        totalAmount: z.coerce.number().min(0).default(0),
        currency: z.string().default('INR'),
        notes: z.string().optional().or(z.literal('')).or(z.null()),
        source: z.enum(['DIRECT', 'OTA', 'MANUAL', 'CSV', 'EMAIL']).default('MANUAL'),
    }).passthrough(),
});

interface BookingRoutesDeps {
    bookingController: BookingController;
    authMiddleware: RequestHandler;
}

export const createBookingRoutes = ({ bookingController, authMiddleware }: BookingRoutesDeps) => {
    const router = Router();

    router.use(authMiddleware);

    router.post(
        '/',
        validateBody(createBookingSchema.shape.body),
        (async (req, res, next) => {
            await bookingController.create(req, res, next);
        }) as RequestHandler
    );

    router.get('/', bookingController.getAll as RequestHandler);
    router.get('/:id', bookingController.get as RequestHandler);

    return router;
};
