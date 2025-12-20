import { Booking, BookingProps } from '../../domain/entities/Booking.js';
import { BookingRepository } from '../../infrastructure/repositories/BookingRepository.js';
import { AvailabilityService } from './AvailabilityService.js';
import { ValidationError } from '../../shared/errors/index.js';

export type CreateBookingDTO = Omit<BookingProps, 'id' | 'createdAt' | 'updatedAt'>;

export class BookingService {
    constructor(
        private bookingRepository: BookingRepository,
        private availabilityService: AvailabilityService
    ) { }

    async createBooking(dto: CreateBookingDTO): Promise<Booking> {
        // 1. Validate dates
        if (dto.startDate >= dto.endDate) {
            throw new ValidationError('End date must be after start date');
        }

        // 2. Check availability
        const isAvailable = await this.availabilityService.checkAvailability(
            dto.resourceId,
            dto.startDate,
            dto.endDate,
            dto.tenantId
        );

        if (!isAvailable) {
            throw new ValidationError('Resource is not available for the selected dates');
        }

        // 3. Create entity
        const booking = Booking.create(dto);

        // 4. Save
        return this.bookingRepository.save(booking);
    }

    async getBooking(id: string, tenantId: string): Promise<Booking | null> {
        return this.bookingRepository.findById(id, tenantId);
    }

    // TODO: Add search/filter methods
}
