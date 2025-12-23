import { GearMaintenance, MaintenanceType, MaintenancePriority } from '../../../domain/entities/gear/GearMaintenance.js';
import { IGearMaintenanceRepository } from '../../../domain/interfaces/gear/IGearMaintenanceRepository.js';
import { IGearItemRepository } from '../../../domain/interfaces/gear/IGearItemRepository.js';
import { IGearInventoryRepository } from '../../../domain/interfaces/gear/IGearInventoryRepository.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/index.js';

interface ScheduleMaintenanceDTO {
    gearItemId: string;
    type: MaintenanceType;
    priority: MaintenancePriority;
    damageReportId?: string;
    scheduledDate?: Date;
    assignedToUserId?: string;
    vendorId?: string;
    description: string;
    estimatedCost?: number;
    warrantyClaimId?: string;
    createdByUserId: string;
    notes?: string;
}

interface CompleteMaintenanceDTO {
    workPerformed: string;
    partsUsed?: { name: string; quantity: number; cost: number }[];
    actualCost: number;
    warrantyApproved?: boolean;
    notes?: string;
}

export class GearMaintenanceService {
    constructor(
        private maintenanceRepository: IGearMaintenanceRepository,
        private itemRepository: IGearItemRepository,
        private inventoryRepository: IGearInventoryRepository
    ) {}

    async scheduleMaintenance(tenantId: string, dto: ScheduleMaintenanceDTO): Promise<GearMaintenance> {
        // Validate item exists
        const item = await this.itemRepository.findById(dto.gearItemId, tenantId);
        if (!item) {
            throw new NotFoundError('Gear item', dto.gearItemId);
        }

        const maintenance = GearMaintenance.create({
            tenantId,
            gearItemId: dto.gearItemId,
            type: dto.type,
            priority: dto.priority,
            damageReportId: dto.damageReportId,
            scheduledDate: dto.scheduledDate,
            assignedToUserId: dto.assignedToUserId,
            vendorId: dto.vendorId,
            description: dto.description,
            estimatedCost: dto.estimatedCost || 0,
            warrantyClaimId: dto.warrantyClaimId,
            createdByUserId: dto.createdByUserId,
            notes: dto.notes || '',
        });

        // Update inventory status
        await this.inventoryRepository.updateStatus(
            dto.gearItemId,
            'UNDER_MAINTENANCE',
            tenantId,
            undefined,
            `Scheduled for ${dto.type.toLowerCase()} maintenance`
        );

        await this.maintenanceRepository.save(maintenance);
        return maintenance;
    }

    async startMaintenance(maintenanceId: string, tenantId: string): Promise<GearMaintenance> {
        const maintenance = await this.maintenanceRepository.findById(maintenanceId, tenantId);
        if (!maintenance) {
            throw new NotFoundError('Maintenance record', maintenanceId);
        }

        if (maintenance.status !== 'SCHEDULED' && maintenance.status !== 'PENDING_PARTS') {
            throw new ValidationError(`Cannot start maintenance in status ${maintenance.status}`);
        }

        maintenance.start();
        await this.maintenanceRepository.save(maintenance);
        return maintenance;
    }

    async completeMaintenance(
        maintenanceId: string,
        tenantId: string,
        dto: CompleteMaintenanceDTO
    ): Promise<GearMaintenance> {
        const maintenance = await this.maintenanceRepository.findById(maintenanceId, tenantId);
        if (!maintenance) {
            throw new NotFoundError('Maintenance record', maintenanceId);
        }

        if (maintenance.status !== 'IN_PROGRESS') {
            throw new ValidationError(`Cannot complete maintenance in status ${maintenance.status}`);
        }

        maintenance.complete(
            dto.workPerformed,
            dto.partsUsed || [],
            dto.actualCost,
            dto.warrantyApproved || false,
            dto.notes || ''
        );

        // Update item's last maintenance date
        const item = await this.itemRepository.findById(maintenance.gearItemId, tenantId);
        if (item) {
            item.recordMaintenance();
            await this.itemRepository.save(item);
        }

        // Return item to available
        await this.inventoryRepository.updateStatus(
            maintenance.gearItemId,
            'AVAILABLE',
            tenantId,
            undefined,
            `Maintenance completed: ${dto.workPerformed}`
        );

        await this.maintenanceRepository.save(maintenance);
        return maintenance;
    }

    async cancelMaintenance(maintenanceId: string, tenantId: string, reason: string): Promise<void> {
        const maintenance = await this.maintenanceRepository.findById(maintenanceId, tenantId);
        if (!maintenance) {
            throw new NotFoundError('Maintenance record', maintenanceId);
        }

        if (maintenance.status === 'COMPLETED') {
            throw new ValidationError('Cannot cancel completed maintenance');
        }

        maintenance.cancel(reason);

        // Return item to available
        await this.inventoryRepository.updateStatus(
            maintenance.gearItemId,
            'AVAILABLE',
            tenantId,
            undefined,
            `Maintenance cancelled: ${reason}`
        );

        await this.maintenanceRepository.save(maintenance);
    }

    async getPendingMaintenance(tenantId: string): Promise<GearMaintenance[]> {
        return this.maintenanceRepository.findPending(tenantId);
    }

    async getInProgressMaintenance(tenantId: string): Promise<GearMaintenance[]> {
        return this.maintenanceRepository.findInProgress(tenantId);
    }

    async getOverdueMaintenance(tenantId: string): Promise<GearMaintenance[]> {
        return this.maintenanceRepository.findOverdue(tenantId);
    }

    async getItemMaintenanceHistory(gearItemId: string, tenantId: string): Promise<GearMaintenance[]> {
        return this.maintenanceRepository.getItemMaintenanceHistory(gearItemId, tenantId);
    }

    async getMaintenanceCosts(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{ total: number; count: number }> {
        return this.maintenanceRepository.getMaintenanceCostsByPeriod(tenantId, startDate, endDate);
    }

    async scheduleInspections(tenantId: string, createdByUserId: string): Promise<number> {
        // Find items that need inspection
        const overdueItems = await this.itemRepository.findInspectionOverdue(tenantId);
        let scheduled = 0;

        for (const item of overdueItems) {
            // Check if already has pending inspection
            const existing = await this.maintenanceRepository.findByGearItem(item.id, tenantId);
            const hasPendingInspection = existing.some(
                m => m.type === 'INSPECTION' && (m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS')
            );

            if (!hasPendingInspection) {
                await this.scheduleMaintenance(tenantId, {
                    gearItemId: item.id,
                    type: 'INSPECTION',
                    priority: item.isSafetyCritical ? 'URGENT' : 'NORMAL',
                    description: `Scheduled inspection - ${item.isSafetyCritical ? 'SAFETY CRITICAL' : 'Routine'}`,
                    createdByUserId,
                });
                scheduled++;
            }
        }

        return scheduled;
    }
}
