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
}
