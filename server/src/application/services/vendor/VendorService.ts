import { Vendor, VendorProps, VendorStatus, VendorType } from '../../../domain/entities/vendor/index.js';
import { VendorRepository } from '../../../infrastructure/repositories/vendor/index.js';
import { VendorFilters } from '../../../domain/interfaces/vendor/index.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/index.js';

export interface CreateVendorDTO {
    legalName: string;
    displayName: string;
    vendorType: VendorType;
    vendorCode?: string;
    primaryContactName?: string;
    primaryContactPhone?: string;
    primaryContactEmail?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    serviceRegions?: string[];
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    upiId?: string;
    taxId?: string;
    taxType?: string;
    paymentPreference?: 'BANK' | 'UPI' | 'CASH';
    defaultCurrency?: string;
    serviceCapacity?: number;
    attributes?: Record<string, unknown>;
}

export type UpdateVendorDTO = Partial<CreateVendorDTO> & {
    internalRating?: number;
    internalNotes?: string;
};

export interface VendorListResult {
    data: Vendor[];
    total: number;
    page: number;
    limit: number;
}

export class VendorService {
    constructor(private vendorRepository: VendorRepository) {}

    async create(dto: CreateVendorDTO, tenantId: string, userId?: string): Promise<Vendor> {
        if (!dto.legalName || !dto.displayName) {
            throw new ValidationError('Legal name and display name are required');
        }

        // Check for duplicate vendor code
        if (dto.vendorCode) {
            const existing = await this.vendorRepository.findByCode(dto.vendorCode, tenantId);
            if (existing) {
                throw new ValidationError(`Vendor with code ${dto.vendorCode} already exists`);
            }
        }

        const vendor = Vendor.create({
            tenantId,
            createdBy: userId,
            ...dto,
        });

        return this.vendorRepository.save(vendor);
    }

    async getById(id: string, tenantId: string): Promise<Vendor> {
        const vendor = await this.vendorRepository.findById(id, tenantId);
        if (!vendor) {
            throw new NotFoundError('Vendor not found');
        }
        return vendor;
    }

    async getAll(
        tenantId: string,
        filters?: VendorFilters,
        pagination?: { page: number; limit: number }
    ): Promise<VendorListResult> {
        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 20;
        const offset = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.vendorRepository.findAll(tenantId, filters, limit, offset),
            this.vendorRepository.count(tenantId, filters),
        ]);

        return { data, total, page, limit };
    }

    async update(id: string, dto: UpdateVendorDTO, tenantId: string): Promise<Vendor> {
        const existing = await this.getById(id, tenantId);
        
        const updated = Vendor.create({
            ...existing,
            ...dto,
            id: existing.id,
            tenantId: existing.tenantId,
        });

        return this.vendorRepository.update(updated);
    }

    async updateStatus(id: string, status: VendorStatus, tenantId: string): Promise<void> {
        await this.getById(id, tenantId); // Ensure exists
        await this.vendorRepository.updateStatus(id, tenantId, status);
    }

    async activate(id: string, tenantId: string): Promise<void> {
        await this.updateStatus(id, 'ACTIVE', tenantId);
    }

    async deactivate(id: string, tenantId: string): Promise<void> {
        await this.updateStatus(id, 'INACTIVE', tenantId);
    }

    async suspend(id: string, tenantId: string): Promise<void> {
        await this.updateStatus(id, 'SUSPENDED', tenantId);
    }

    async getByType(tenantId: string, type: VendorType): Promise<Vendor[]> {
        return this.vendorRepository.findByType(tenantId, type);
    }

    async getActive(tenantId: string): Promise<Vendor[]> {
        return this.vendorRepository.findActive(tenantId);
    }

    async search(tenantId: string, query: string): Promise<Vendor[]> {
        return this.vendorRepository.search(tenantId, query);
    }
}
