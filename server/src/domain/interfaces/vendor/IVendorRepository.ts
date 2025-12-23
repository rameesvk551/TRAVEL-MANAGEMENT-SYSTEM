import { Vendor, VendorType, VendorStatus } from '../../entities/vendor/index.js';

export interface VendorFilters {
    vendorType?: VendorType;
    status?: VendorStatus;
    search?: string;
    city?: string;
    serviceRegion?: string;
    isActive?: boolean;
}

export interface IVendorRepository {
    findById(id: string, tenantId: string): Promise<Vendor | null>;
    findByCode(code: string, tenantId: string): Promise<Vendor | null>;
    findAll(
        tenantId: string,
        filters?: VendorFilters,
        limit?: number,
        offset?: number
    ): Promise<Vendor[]>;
    count(tenantId: string, filters?: VendorFilters): Promise<number>;
    save(vendor: Vendor): Promise<Vendor>;
    update(vendor: Vendor): Promise<Vendor>;
    updateStatus(id: string, tenantId: string, status: VendorStatus): Promise<void>;
    findByType(tenantId: string, type: VendorType): Promise<Vendor[]>;
    findActive(tenantId: string): Promise<Vendor[]>;
    search(tenantId: string, query: string): Promise<Vendor[]>;
}
