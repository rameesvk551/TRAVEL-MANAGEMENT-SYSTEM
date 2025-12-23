import { GearRental, GearRentalType, RentalPricingModel } from '../../../domain/entities/gear/GearRental.js';
import { IGearRentalRepository } from '../../../domain/interfaces/gear/IGearRentalRepository.js';
import { IGearItemRepository } from '../../../domain/interfaces/gear/IGearItemRepository.js';
import { IGearInventoryRepository } from '../../../domain/interfaces/gear/IGearInventoryRepository.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/index.js';

interface CreateRentalDTO {
    rentalType: GearRentalType;
    pricingModel: RentalPricingModel;
    customerId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerIdType?: string;
    customerIdNumber?: string;
    partnerVendorId?: string;
    tripId?: string;
    bookingId?: string;
    items: {
        gearItemId: string;
        dailyRate?: number;
        tripRate?: number;
    }[];
    startDate: Date;
    endDate: Date;
    discountAmount?: number;
    discountReason?: string;
    depositAmount?: number;
    lateFeePerDay?: number;
    terms?: string;
    notes?: string;
}

interface IssueRentalDTO {
    issuedByUserId: string;
    signatureData?: string;
    notes?: string;
}

interface ReturnRentalDTO {
    receivedByUserId: string;
    itemReturns: {
        gearItemId: string;
        returnCondition: string;
        hasDamage: boolean;
        damageDescription?: string;
    }[];
    notes?: string;
}

export class GearRentalService {
    constructor(
        private rentalRepository: IGearRentalRepository,
        private itemRepository: IGearItemRepository,
        private inventoryRepository: IGearInventoryRepository
    ) {}

    async createRental(tenantId: string, dto: CreateRentalDTO): Promise<GearRental> {
        // Validate items exist and are rentable
        const items: {
            gearItemId: string;
            dailyRate: number;
            tripRate: number;
            days: number;
            subtotal: number;
            depositAmount: number;
        }[] = [];

        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        if (totalDays < 1) {
            throw new ValidationError('End date must be after start date');
        }

        let subtotal = 0;
        let totalDeposit = 0;

        for (const itemDto of dto.items) {
            const item = await this.itemRepository.findById(itemDto.gearItemId, tenantId);
            if (!item) {
                throw new NotFoundError('Gear item', itemDto.gearItemId);
            }

            if (!item.isRentable) {
                throw new ValidationError(`Item ${item.name} is not available for rental`);
            }

            // Check availability
            const inventory = await this.inventoryRepository.findByGearItem(itemDto.gearItemId, tenantId);
            if (!inventory || inventory.status !== 'AVAILABLE') {
                throw new ValidationError(`Item ${item.name} is not available`);
            }

            const dailyRate = itemDto.dailyRate ?? item.rentalPricePerDay;
            const tripRate = itemDto.tripRate ?? item.rentalPricePerTrip;
            const itemSubtotal = dto.pricingModel === 'PER_DAY' 
                ? dailyRate * totalDays 
                : tripRate;

            items.push({
                gearItemId: item.id,
                dailyRate,
                tripRate,
                days: totalDays,
                subtotal: itemSubtotal,
                depositAmount: item.depositAmount,
            });

            subtotal += itemSubtotal;
            totalDeposit += item.depositAmount;
        }

        const rentalNumber = await this.rentalRepository.generateRentalNumber(tenantId);

        // Calculate totals
        const discountAmount = dto.discountAmount || 0;
        const taxAmount = (subtotal - discountAmount) * 0.18; // 18% GST
        const totalAmount = subtotal - discountAmount + taxAmount;

        const rental = GearRental.create({
            tenantId,
            rentalNumber,
            rentalType: dto.rentalType,
            pricingModel: dto.pricingModel,
            customerId: dto.customerId,
            customerName: dto.customerName,
            customerEmail: dto.customerEmail,
            customerPhone: dto.customerPhone,
            customerIdType: dto.customerIdType,
            customerIdNumber: dto.customerIdNumber,
            partnerVendorId: dto.partnerVendorId,
            tripId: dto.tripId,
            bookingId: dto.bookingId,
            items,
            startDate,
            endDate,
            totalDays,
            subtotal,
            discountAmount,
            discountReason: dto.discountReason || '',
            taxAmount,
            totalAmount,
            depositAmount: dto.depositAmount ?? totalDeposit,
            lateFeePerDay: dto.lateFeePerDay || 100,
            currency: 'INR',
            terms: dto.terms || '',
            notes: dto.notes || '',
        });

        // Reserve items
        for (const item of items) {
            await this.inventoryRepository.updateStatus(
                item.gearItemId,
                'RESERVED',
                tenantId,
                undefined,
                `Reserved for rental ${rentalNumber}`
            );
        }

        await this.rentalRepository.save(rental);
        return rental;
    }

    async issueRental(rentalId: string, tenantId: string, dto: IssueRentalDTO): Promise<GearRental> {
        const rental = await this.rentalRepository.findById(rentalId, tenantId);
        if (!rental) {
            throw new NotFoundError('Rental', rentalId);
        }

        if (rental.status !== 'RESERVED' && rental.status !== 'QUOTE') {
            throw new ValidationError(`Cannot issue rental in status ${rental.status}`);
        }

        rental.issue(dto.issuedByUserId, dto.signatureData);

        // Update inventory to rented out
        for (const item of rental.items) {
            await this.inventoryRepository.updateStatus(
                item.gearItemId,
                'RENTED_OUT',
                tenantId,
                undefined,
                `Issued for rental ${rental.rentalNumber}`
            );
        }

        await this.rentalRepository.save(rental);
        return rental;
    }

    async returnRental(rentalId: string, tenantId: string, dto: ReturnRentalDTO): Promise<GearRental> {
        const rental = await this.rentalRepository.findById(rentalId, tenantId);
        if (!rental) {
            throw new NotFoundError('Rental', rentalId);
        }

        if (rental.status !== 'ACTIVE' && rental.status !== 'OVERDUE') {
            throw new ValidationError(`Cannot return rental in status ${rental.status}`);
        }

        // Check for late return
        const now = new Date();
        const daysLate = Math.max(0, Math.ceil((now.getTime() - rental.endDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        let damageCharges = 0;
        let hasDamage = false;

        for (const itemReturn of dto.itemReturns) {
            if (itemReturn.hasDamage) {
                hasDamage = true;
                // Basic damage charge - in real scenario, would be determined by damage report
                damageCharges += 500; // Default damage assessment fee
            }

            // Return item to available (or damaged if applicable)
            await this.inventoryRepository.updateStatus(
                itemReturn.gearItemId,
                itemReturn.hasDamage ? 'DAMAGED' : 'AVAILABLE',
                tenantId,
                undefined,
                `Returned from rental ${rental.rentalNumber}`
            );
        }

        rental.returnRental(dto.receivedByUserId, hasDamage, daysLate, damageCharges);
        await this.rentalRepository.save(rental);
        
        return rental;
    }

    async cancelRental(rentalId: string, tenantId: string): Promise<void> {
        const rental = await this.rentalRepository.findById(rentalId, tenantId);
        if (!rental) {
            throw new NotFoundError('Rental', rentalId);
        }

        if (rental.status === 'ACTIVE' || rental.status === 'OVERDUE') {
            throw new ValidationError('Cannot cancel an active rental, must return first');
        }

        rental.cancel();

        // Release reserved items
        for (const item of rental.items) {
            await this.inventoryRepository.updateStatus(
                item.gearItemId,
                'AVAILABLE',
                tenantId,
                undefined,
                `Released from cancelled rental ${rental.rentalNumber}`
            );
        }

        await this.rentalRepository.save(rental);
    }

    async getActiveRentals(tenantId: string): Promise<GearRental[]> {
        return this.rentalRepository.findActive(tenantId);
    }

    async getOverdueRentals(tenantId: string): Promise<GearRental[]> {
        return this.rentalRepository.findOverdue(tenantId);
    }

    async getRentalRevenue(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{ total: number; count: number }> {
        return this.rentalRepository.getRevenueByPeriod(tenantId, startDate, endDate);
    }
}
