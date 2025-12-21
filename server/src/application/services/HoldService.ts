import { HOLD_TTL, HoldSource, HoldType } from '../../domain/entities/InventoryHold.js';
import { IDepartureRepository, HoldResult } from '../../domain/interfaces/index.js';
import { NotFoundError, ValidationError } from '../../shared/errors/index.js';

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
 * Active hold information
 */
export interface ActiveHold {
    id: string;
    seatCount: number;
    source: string;
    holdType: string;
    expiresAt: Date;
    remainingMinutes: number;
    createdById?: string;
    sessionId?: string;
}

/**
 * HoldService - Manages time-bound inventory holds.
 * 
 * CRITICAL: Holds are the mechanism that prevents race conditions.
 * When a user starts a booking:
 * 1. Create a CART hold (15 min)
 * 2. When they enter payment, extend to PAYMENT_PENDING (30 min)
 * 3. On payment success, release hold and confirm booking
 * 4. On expiry, automatically release seats back to pool
 */
export class HoldService {
    constructor(private departureRepository: IDepartureRepository) {}

    /**
     * Create a hold on inventory
     * 
     * This operation is ATOMIC - uses database row-level locking
     * to prevent race conditions when multiple users try to hold
     * the same seats.
     */
    async createHold(dto: CreateHoldDTO): Promise<HoldResult> {
        // Validate seat count
        if (dto.seatCount < 1) {
            return {
                success: false,
                errorCode: 'INVALID_SEAT_COUNT',
                errorMessage: 'Seat count must be at least 1',
            };
        }

        // Get TTL based on hold type
        const ttlMinutes = HOLD_TTL[dto.holdType];

        // Call repository (handles atomic locking)
        return this.departureRepository.createHold({
            tenantId: dto.tenantId,
            departureId: dto.departureId,
            seatCount: dto.seatCount,
            source: dto.source,
            sourcePlatform: dto.sourcePlatform,
            holdType: dto.holdType,
            ttlMinutes,
            createdById: dto.createdById,
            sessionId: dto.sessionId,
        });
    }

    /**
     * Release a hold (on cancellation or confirmation)
     */
    async releaseHold(
        holdId: string,
        reason: 'CONFIRMED' | 'CANCELLED' | 'MANUAL',
        actorId?: string
    ): Promise<boolean> {
        return this.departureRepository.releaseHold(holdId, reason, actorId);
    }

    /**
     * Extend a hold's expiry time
     * 
     * Use case: User started with CART hold, now entering payment details
     */
    async extendHold(holdId: string, newHoldType: HoldType): Promise<boolean> {
        const currentTtl = HOLD_TTL[newHoldType];
        return this.departureRepository.extendHold(holdId, currentTtl);
    }

    /**
     * Get active holds for a departure
     */
    async getActiveHolds(departureId: string): Promise<ActiveHold[]> {
        const holds = await this.departureRepository.getActiveHolds(departureId);
        
        return holds.map(hold => ({
            ...hold,
            remainingMinutes: Math.max(
                0,
                Math.ceil((hold.expiresAt.getTime() - Date.now()) / 60000)
            ),
        }));
    }

    /**
     * Process expired holds (called by cron job)
     * 
     * This should run every minute to release expired holds
     * and return seats to the available pool.
     */
    async processExpiredHolds(): Promise<number> {
        return this.departureRepository.expireStaleHolds();
    }
}
