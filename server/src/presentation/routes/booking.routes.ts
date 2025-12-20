import { Router, RequestHandler } from 'express';
import { BookingController } from '../controllers/BookingController.js';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.middleware.js';

const createBookingSchema = z.object({
    body: z.object({
        resourceId: z.string().uuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        guestName: z.string().min(1),
        guestEmail: z.string().email().optional(),
        guestPhone: z.string().optional(),
        guestCount: z.number().int().positive(),
        baseAmount: z.number().positive(),
        totalAmount: z.number().positive(),
        currency: z.string().default('INR'),
        notes: z.string().optional(),
        source: z.enum(['DIRECT', 'OTA', 'MANUAL', 'CSV', 'EMAIL']).default('MANUAL'),
    }),
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
            // Convert string dates to Date objects
            if (req.body.startDate && typeof req.body.startDate === 'string') {
                req.body.startDate = new Date(req.body.startDate);
            }
            if (req.body.endDate && typeof req.body.endDate === 'string') {
                req.body.endDate = new Date(req.body.endDate);
            }
            await bookingController.create(req, res, next);
        }) as RequestHandler
    );

    router.get('/:id', bookingController.get as RequestHandler);

    return router;
};
