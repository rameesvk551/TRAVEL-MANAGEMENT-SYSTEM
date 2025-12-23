import { VendorSettlement, SettlementMethod } from '../../entities/vendor/index.js';

export interface SettlementFilters {
    vendorId?: string;
    paymentMethod?: SettlementMethod;
    isVerified?: boolean;
    paymentDateFrom?: Date;
    paymentDateTo?: Date;
}

export interface SettlementSummary {
    totalAmount: number;
    count: number;
    byMethod: Record<SettlementMethod, number>;
}

export interface IVendorSettlementRepository {
    findById(id: string, tenantId: string): Promise<VendorSettlement | null>;
    findByNumber(settlementNumber: string, tenantId: string): Promise<VendorSettlement | null>;
    findByVendor(vendorId: string, tenantId: string): Promise<VendorSettlement[]>;
    findByPayable(payableId: string, tenantId: string): Promise<VendorSettlement[]>;
    findAll(
        tenantId: string,
        filters?: SettlementFilters,
        limit?: number,
        offset?: number
    ): Promise<VendorSettlement[]>;
    count(tenantId: string, filters?: SettlementFilters): Promise<number>;
    save(settlement: VendorSettlement): Promise<VendorSettlement>;
    update(settlement: VendorSettlement): Promise<VendorSettlement>;
    verify(id: string, tenantId: string, verifiedBy: string): Promise<void>;
    getSummary(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<SettlementSummary>;
    getVendorSummary(vendorId: string, tenantId: string): Promise<SettlementSummary>;
    linkPayables(settlementId: string, payableAmounts: Array<{ payableId: string; amount: number }>): Promise<void>;
}
