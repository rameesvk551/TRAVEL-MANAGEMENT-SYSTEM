import { BookingRepository, ResourceRepository } from '../../infrastructure/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

export class AvailabilityService {
    constructor(
        private bookingRepository: BookingRepository,
        private resourceRepository: ResourceRepository
    ) { }

    async checkAvailability(
        resourceId: string,
        startDate: Date,
        endDate: Date,
        tenantId: string,
        excludeBookingId?: string
    ): Promise<boolean> {
        // 1. Get resource to check capacity
        const resource = await this.resourceRepository.findById(resourceId, tenantId);
        if (!resource || !resource.isActive) {
            throw new NotFoundError('Resource', resourceId);
        }

        // 2. Count existing bookings overlapping this period
        const overlappingCount = await this.bookingRepository.countOverlapping(
            resourceId,
            startDate,
            endDate,
            excludeBookingId
        );

        // 3. Compare with capacity
        // If overlapping < capacity, then at least one slot is free
        return overlappingCount < resource.capacity;
    }
}
