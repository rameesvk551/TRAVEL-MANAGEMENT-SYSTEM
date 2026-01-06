import { Request, Response, NextFunction } from 'express';
import { BookingService, CreateBookingDTO } from '../../application/services/BookingService.js';

export class BookingController {
    constructor(private bookingService: BookingService) { }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = {
                ...req.body,
                tenantId: req.context.tenantId,
                createdById: req.context.userId,
            } as CreateBookingDTO;

            const booking = await this.bookingService.createBooking(dto);
            res.status(201).json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    };

    get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.getBooking(id, req.context.tenantId);

            if (!booking) {
                res.status(404).json({ success: false, error: 'Booking not found' });
                return;
            }

            res.json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { resourceId, status, limit, offset } = req.query;

            const result = await this.bookingService.getAll(tenantId, {
                resourceId: resourceId as string,
                status: status as string,
                limit: limit ? parseInt(limit as string) : undefined,
                offset: offset ? parseInt(offset as string) : undefined,
            });

            res.json({
                success: true,
                data: result.bookings,
                meta: {
                    total: result.total,
                    limit: limit ? parseInt(limit as string) : 20,
                    offset: offset ? parseInt(offset as string) : 0,
                },
            });
        } catch (error) {
            next(error);
        }
    };
}
