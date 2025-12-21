import {
    DepartureInstance,
    DepartureInstanceProps,
    DepartureStatus,
} from '../../domain/entities/index.js';
import {
    IDepartureRepository,
    InventoryState,
    DepartureFilter,
    HoldResult,
} from '../../domain/interfaces/index.js';
import { NotFoundError, ValidationError } from '../../shared/errors/index.js';
import { HOLD_TTL, HoldType, HoldSource } from '../../domain/entities/InventoryHold.js';

/**
 * DTO for creating a departure instance
 */
export interface CreateDepartureDTO {
    tenantId: string;
    resourceId: string;
    departureDate: Date;
    departureTime?: string;
    endDate?: Date;
    cutoffDatetime?: Date;
    totalCapacity: number;
    blockedSeats?: number;
    overbookingLimit?: number;
    minParticipants?: number;
    priceOverride?: number;
    currency?: string;
    attributes?: Record<string, unknown>;
}

/**
 * DTO for creating an inventory hold
 */
export interface CreateHoldDTO {
    tenantId: string;
    departureId: string;
    seatCount: number;
    source: HoldSource;
    sourcePlatform?: string;
    holdType: HoldType;
    createdById?: string;
    sessionId?: string;
}

/**
 * Inventory response with computed availability
 */
export interface DepartureWithInventory {
    departure: DepartureInstance;
    inventory: InventoryState;
}

/**
 * InventoryService - The authoritative source for all inventory operations.
 * 
 * CRITICAL: This service is responsible for:
 * - Atomic seat locking (holds)
 * - Availability calculations
 * - Race condition prevention
 * - Overbooking management
 * 
 * All booking flows MUST go through this service for inventory changes.
 */
export class InventoryService {
    constructor(private departureRepository: IDepartureRepository) {}

    /**
     * Create a new departure instance (inventory for a specific date)
     */
    async createDeparture(dto: CreateDepartureDTO): Promise<DepartureInstance> {
        // Validate capacity
        if (dto.totalCapacity < 1) {
            throw new ValidationError('Total capacity must be at least 1');
        }

        if (dto.blockedSeats && dto.blockedSeats >= dto.totalCapacity) {
            throw new ValidationError('Blocked seats cannot exceed total capacity');
        }

        // Validate dates
        if (dto.departureDate < new Date()) {
            throw new ValidationError('Departure date cannot be in the past');
        }

        if (dto.endDate && dto.endDate < dto.departureDate) {
            throw new ValidationError('End date must be after departure date');
        }

        const departure = DepartureInstance.create({
            ...dto,
            status: 'SCHEDULED',
        });

        return this.departureRepository.save(departure);
    }

    /**
     * Get departure with real-time inventory state
     */
    async getDepartureWithInventory(
        departureId: string,
        tenantId: string
    ): Promise<DepartureWithInventory> {
        const departure = await this.departureRepository.findById(departureId, tenantId);
        if (!departure) {
            throw new NotFoundError('Departure', departureId);
        }

        const inventory = await this.departureRepository.getInventoryState(departureId);
        if (!inventory) {
            throw new NotFoundError('Inventory state', departureId);
        }

        return { departure, inventory };
    }

    /**
     * Get departures for calendar view with inventory states
     */
    async getDeparturesForCalendar(
        tenantId: string,
        dateFrom: Date,
        dateTo: Date,
        filter?: DepartureFilter
    ): Promise<DepartureWithInventory[]> {
        const departures = await this.departureRepository.findByDateRange(
            tenantId,
            dateFrom,
            dateTo,
            filter
        );

        if (departures.length === 0) return [];

        const inventoryStates = await this.departureRepository.getInventoryStates(
            departures.map(d => d.id)
        );

        const inventoryMap = new Map(inventoryStates.map(s => [s.departureId, s]));

        return departures.map(departure => ({
            departure,
            inventory: inventoryMap.get(departure.id)!,
        }));
    }

    /**
     * Check availability for a departure
     */
    async checkAvailability(
        departureId: string,
        seatCount: number
    ): Promise<{
        available: boolean;
        availableSeats: number;
        bookableSeats: number;
        requiresOverbooking: boolean;
    }> {
        const inventory = await this.departureRepository.getInventoryState(departureId);
        if (!inventory) {
            throw new NotFoundError('Departure', departureId);
        }

        const available = inventory.bookableSeats >= seatCount;
        const requiresOverbooking = inventory.availableSeats < seatCount && available;

        return {
            available,
            availableSeats: inventory.availableSeats,
            bookableSeats: inventory.bookableSeats,
            requiresOverbooking,
        };
    }
}
