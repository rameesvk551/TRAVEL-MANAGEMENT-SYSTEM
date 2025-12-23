import { VendorRate, RateType } from '../../entities/vendor/index.js';

export interface RateFilters {
    vendorId?: string;
    contractId?: string;
    rateType?: RateType;
    isCurrent?: boolean;
    isActive?: boolean;
    validOn?: Date;
}

export interface IVendorRateRepository {
    findById(id: string, tenantId: string): Promise<VendorRate | null>;
    findByVendor(vendorId: string, tenantId: string): Promise<VendorRate[]>;
    findCurrentByVendor(vendorId: string, tenantId: string): Promise<VendorRate[]>;
    findValidForDate(vendorId: string, tenantId: string, date: Date): Promise<VendorRate[]>;
    findAll(
        tenantId: string,
        filters?: RateFilters,
        limit?: number,
        offset?: number
    ): Promise<VendorRate[]>;
    count(tenantId: string, filters?: RateFilters): Promise<number>;
    save(rate: VendorRate): Promise<VendorRate>;
    update(rate: VendorRate): Promise<VendorRate>;
    deactivate(id: string, tenantId: string): Promise<void>;
    createNewVersion(rate: VendorRate, previousId: string): Promise<VendorRate>;
}
