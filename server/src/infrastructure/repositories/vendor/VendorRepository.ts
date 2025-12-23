import { query } from '../../database/index.js';
import { Vendor, VendorType, VendorStatus } from '../../../domain/entities/vendor/index.js';
import { IVendorRepository, VendorFilters } from '../../../domain/interfaces/vendor/index.js';

interface VendorRow {
    id: string;
    tenant_id: string;
    legal_name: string;
    display_name: string;
    vendor_type: VendorType;
    vendor_code: string | null;
    primary_contact_name: string | null;
    primary_contact_phone: string | null;
    primary_contact_email: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    country: string;
    postal_code: string | null;
    service_regions: string[];
    bank_name: string | null;
    bank_account_number: string | null;
    bank_ifsc_code: string | null;
    upi_id: string | null;
    tax_id: string | null;
    tax_type: string | null;
    payment_preference: 'BANK' | 'UPI' | 'CASH';
    default_currency: string;
    compliance_documents: unknown[];
    service_capacity: number | null;
    reliability_score: string;
    total_assignments: number;
    completed_assignments: number;
    cancelled_assignments: number;
    dispute_count: number;
    on_time_rate: string;
    internal_rating: string;
    internal_notes: string | null;
    status: VendorStatus;
    attributes: Record<string, unknown>;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: VendorRow): Vendor {
    return Vendor.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        legalName: row.legal_name,
        displayName: row.display_name,
        vendorType: row.vendor_type,
        vendorCode: row.vendor_code ?? undefined,
        primaryContactName: row.primary_contact_name ?? undefined,
        primaryContactPhone: row.primary_contact_phone ?? undefined,
        primaryContactEmail: row.primary_contact_email ?? undefined,
        emergencyContactName: row.emergency_contact_name ?? undefined,
        emergencyContactPhone: row.emergency_contact_phone ?? undefined,
        addressLine1: row.address_line1 ?? undefined,
        addressLine2: row.address_line2 ?? undefined,
        city: row.city ?? undefined,
        state: row.state ?? undefined,
        country: row.country,
        postalCode: row.postal_code ?? undefined,
        serviceRegions: row.service_regions ?? [],
        bankName: row.bank_name ?? undefined,
        bankAccountNumber: row.bank_account_number ?? undefined,
        bankIfscCode: row.bank_ifsc_code ?? undefined,
        upiId: row.upi_id ?? undefined,
        taxId: row.tax_id ?? undefined,
        taxType: row.tax_type ?? undefined,
        paymentPreference: row.payment_preference,
        defaultCurrency: row.default_currency,
        complianceDocuments: row.compliance_documents as Vendor['complianceDocuments'],
        serviceCapacity: row.service_capacity ?? undefined,
        reliabilityScore: parseFloat(row.reliability_score),
        totalAssignments: row.total_assignments,
        completedAssignments: row.completed_assignments,
        cancelledAssignments: row.cancelled_assignments,
        disputeCount: row.dispute_count,
        onTimeRate: parseFloat(row.on_time_rate),
        internalRating: parseFloat(row.internal_rating),
        internalNotes: row.internal_notes ?? undefined,
        status: row.status,
        attributes: row.attributes,
        createdBy: row.created_by ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

function buildWhereClause(tenantId: string, filters?: VendorFilters): { clause: string; params: unknown[] } {
    const conditions = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (filters?.vendorType) {
        conditions.push(`vendor_type = $${idx++}`);
        params.push(filters.vendorType);
    }
    if (filters?.status) {
        conditions.push(`status = $${idx++}`);
        params.push(filters.status);
    }
    if (filters?.city) {
        conditions.push(`city ILIKE $${idx++}`);
        params.push(`%${filters.city}%`);
    }
    if (filters?.search) {
        conditions.push(`(legal_name ILIKE $${idx} OR display_name ILIKE $${idx})`);
        params.push(`%${filters.search}%`);
        idx++;
    }

    return { clause: conditions.join(' AND '), params };
}

export class VendorRepository implements IVendorRepository {
    async findById(id: string, tenantId: string): Promise<Vendor | null> {
        const result = await query<VendorRow>(
            'SELECT * FROM vendors WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByCode(code: string, tenantId: string): Promise<Vendor | null> {
        const result = await query<VendorRow>(
            'SELECT * FROM vendors WHERE vendor_code = $1 AND tenant_id = $2',
            [code, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(tenantId: string, filters?: VendorFilters, limit = 20, offset = 0): Promise<Vendor[]> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const sql = `SELECT * FROM vendors WHERE ${clause} ORDER BY display_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const result = await query<VendorRow>(sql, [...params, limit, offset]);
        return result.rows.map(toEntity);
    }

    async count(tenantId: string, filters?: VendorFilters): Promise<number> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const result = await query<{ count: string }>(`SELECT COUNT(*) as count FROM vendors WHERE ${clause}`, params);
        return parseInt(result.rows[0].count, 10);
    }

    async save(vendor: Vendor): Promise<Vendor> {
        const sql = `INSERT INTO vendors (
            id, tenant_id, legal_name, display_name, vendor_type, vendor_code,
            primary_contact_name, primary_contact_phone, primary_contact_email,
            emergency_contact_name, emergency_contact_phone,
            address_line1, address_line2, city, state, country, postal_code,
            service_regions, bank_name, bank_account_number, bank_ifsc_code, upi_id,
            tax_id, tax_type, payment_preference, default_currency, compliance_documents,
            service_capacity, status, attributes, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
        RETURNING *`;
        const result = await query<VendorRow>(sql, [
            vendor.id, vendor.tenantId, vendor.legalName, vendor.displayName, vendor.vendorType,
            vendor.vendorCode, vendor.primaryContactName, vendor.primaryContactPhone, vendor.primaryContactEmail,
            vendor.emergencyContactName, vendor.emergencyContactPhone,
            vendor.addressLine1, vendor.addressLine2, vendor.city, vendor.state, vendor.country, vendor.postalCode,
            JSON.stringify(vendor.serviceRegions), vendor.bankName, vendor.bankAccountNumber, vendor.bankIfscCode,
            vendor.upiId, vendor.taxId, vendor.taxType, vendor.paymentPreference, vendor.defaultCurrency,
            JSON.stringify(vendor.complianceDocuments), vendor.serviceCapacity, vendor.status,
            JSON.stringify(vendor.attributes), vendor.createdBy
        ]);
        return toEntity(result.rows[0]);
    }

    async update(vendor: Vendor): Promise<Vendor> {
        const sql = `UPDATE vendors SET
            legal_name=$2, display_name=$3, vendor_type=$4, vendor_code=$5,
            primary_contact_name=$6, primary_contact_phone=$7, primary_contact_email=$8,
            emergency_contact_name=$9, emergency_contact_phone=$10,
            address_line1=$11, address_line2=$12, city=$13, state=$14, country=$15, postal_code=$16,
            service_regions=$17, bank_name=$18, bank_account_number=$19, bank_ifsc_code=$20, upi_id=$21,
            tax_id=$22, tax_type=$23, payment_preference=$24, default_currency=$25, compliance_documents=$26,
            service_capacity=$27, internal_rating=$28, internal_notes=$29, attributes=$30
        WHERE id=$1 AND tenant_id=$31 RETURNING *`;
        const result = await query<VendorRow>(sql, [
            vendor.id, vendor.legalName, vendor.displayName, vendor.vendorType, vendor.vendorCode,
            vendor.primaryContactName, vendor.primaryContactPhone, vendor.primaryContactEmail,
            vendor.emergencyContactName, vendor.emergencyContactPhone,
            vendor.addressLine1, vendor.addressLine2, vendor.city, vendor.state, vendor.country, vendor.postalCode,
            JSON.stringify(vendor.serviceRegions), vendor.bankName, vendor.bankAccountNumber, vendor.bankIfscCode,
            vendor.upiId, vendor.taxId, vendor.taxType, vendor.paymentPreference, vendor.defaultCurrency,
            JSON.stringify(vendor.complianceDocuments), vendor.serviceCapacity, vendor.internalRating,
            vendor.internalNotes, JSON.stringify(vendor.attributes), vendor.tenantId
        ]);
        return toEntity(result.rows[0]);
    }

    async updateStatus(id: string, tenantId: string, status: VendorStatus): Promise<void> {
        await query('UPDATE vendors SET status=$1 WHERE id=$2 AND tenant_id=$3', [status, id, tenantId]);
    }

    async findByType(tenantId: string, type: VendorType): Promise<Vendor[]> {
        const result = await query<VendorRow>(
            'SELECT * FROM vendors WHERE tenant_id=$1 AND vendor_type=$2 ORDER BY display_name',
            [tenantId, type]
        );
        return result.rows.map(toEntity);
    }

    async findActive(tenantId: string): Promise<Vendor[]> {
        const result = await query<VendorRow>(
            "SELECT * FROM vendors WHERE tenant_id=$1 AND status='ACTIVE' ORDER BY display_name",
            [tenantId]
        );
        return result.rows.map(toEntity);
    }

    async search(tenantId: string, q: string): Promise<Vendor[]> {
        const result = await query<VendorRow>(
            `SELECT * FROM vendors WHERE tenant_id=$1 AND 
             (legal_name ILIKE $2 OR display_name ILIKE $2 OR vendor_code ILIKE $2) LIMIT 20`,
            [tenantId, `%${q}%`]
        );
        return result.rows.map(toEntity);
    }
}
