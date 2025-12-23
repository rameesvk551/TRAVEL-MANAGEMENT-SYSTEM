import { VendorContract, ContractStatus } from '../../entities/vendor/index.js';

export interface ContractFilters {
    status?: ContractStatus;
    vendorId?: string;
    isActive?: boolean;
    startDateFrom?: Date;
    startDateTo?: Date;
}

export interface IVendorContractRepository {
    findById(id: string, tenantId: string): Promise<VendorContract | null>;
    findByVendor(vendorId: string, tenantId: string): Promise<VendorContract[]>;
    findActiveByVendor(vendorId: string, tenantId: string): Promise<VendorContract | null>;
    findAll(
        tenantId: string,
        filters?: ContractFilters,
        limit?: number,
        offset?: number
    ): Promise<VendorContract[]>;
    count(tenantId: string, filters?: ContractFilters): Promise<number>;
    save(contract: VendorContract): Promise<VendorContract>;
    update(contract: VendorContract): Promise<VendorContract>;
    updateStatus(id: string, tenantId: string, status: ContractStatus): Promise<void>;
    findExpiring(tenantId: string, daysAhead: number): Promise<VendorContract[]>;
}
