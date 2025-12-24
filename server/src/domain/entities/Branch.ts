import { generateId } from '../../shared/utils/index.js';

export type BranchType = 'HEAD_OFFICE' | 'REGIONAL_OFFICE' | 'OFFICE' | 'WAREHOUSE' | 'OPERATIONAL_BASE';

export interface BranchOperatingHours {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
}

export interface BranchSettings {
    allowBookings?: boolean;
    allowLeads?: boolean;
    defaultCurrency?: string;
    taxRate?: number;
    bookingPrefix?: string;
    [key: string]: unknown;
}

export interface BranchAddress {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export interface BranchProps {
    id?: string;
    tenantId: string;
    name: string;
    code: string;
    type?: BranchType;
    description?: string;
    
    // Address
    address?: BranchAddress;
    
    // Contact
    phone?: string;
    email?: string;
    
    // Location
    latitude?: number;
    longitude?: number;
    timezone?: string;
    
    // Hierarchy
    parentBranchId?: string;
    managerId?: string;
    
    // Configuration
    currency?: string;
    operatingHours?: BranchOperatingHours;
    settings?: BranchSettings;
    
    // Status
    isActive?: boolean;
    
    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Branch entity - represents a physical location/office within a tenant.
 * Branches enable multi-location operations with data isolation and cross-branch visibility.
 */
export class Branch {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly name: string;
    public readonly code: string;
    public readonly type: BranchType;
    public readonly description: string | null;
    
    // Address
    public readonly address: BranchAddress;
    
    // Contact
    public readonly phone: string | null;
    public readonly email: string | null;
    
    // Location
    public readonly latitude: number | null;
    public readonly longitude: number | null;
    public readonly timezone: string;
    
    // Hierarchy
    public readonly parentBranchId: string | null;
    public readonly managerId: string | null;
    
    // Configuration
    public readonly currency: string;
    public readonly operatingHours: BranchOperatingHours;
    public readonly settings: BranchSettings;
    
    // Status
    public readonly isActive: boolean;
    
    // Timestamps
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<Omit<BranchProps, 'address'>> & { address: BranchAddress }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.name = props.name;
        this.code = props.code;
        this.type = props.type;
        this.description = props.description ?? null;
        this.address = props.address;
        this.phone = props.phone ?? null;
        this.email = props.email ?? null;
        this.latitude = props.latitude ?? null;
        this.longitude = props.longitude ?? null;
        this.timezone = props.timezone;
        this.parentBranchId = props.parentBranchId ?? null;
        this.managerId = props.managerId ?? null;
        this.currency = props.currency;
        this.operatingHours = props.operatingHours;
        this.settings = props.settings;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: BranchProps): Branch {
        return new Branch({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            name: props.name,
            code: props.code.toUpperCase(),
            type: props.type ?? 'OFFICE',
            description: props.description ?? null,
            address: props.address ?? {},
            phone: props.phone ?? null,
            email: props.email ?? null,
            latitude: props.latitude ?? null,
            longitude: props.longitude ?? null,
            timezone: props.timezone ?? 'Asia/Kolkata',
            parentBranchId: props.parentBranchId ?? null,
            managerId: props.managerId ?? null,
            currency: props.currency ?? 'INR',
            operatingHours: props.operatingHours ?? {},
            settings: props.settings ?? {},
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: Required<BranchProps>): Branch {
        return new Branch({
            ...data,
            address: data.address ?? {},
        });
    }

    /**
     * Check if this is the head office
     */
    isHeadOffice(): boolean {
        return this.type === 'HEAD_OFFICE';
    }

    /**
     * Check if this branch has a parent
     */
    hasParent(): boolean {
        return this.parentBranchId !== null;
    }

    /**
     * Get formatted address string
     */
    getFormattedAddress(): string {
        const parts = [
            this.address.line1,
            this.address.line2,
            this.address.city,
            this.address.state,
            this.address.postalCode,
            this.address.country,
        ].filter(Boolean);
        return parts.join(', ');
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            tenantId: this.tenantId,
            name: this.name,
            code: this.code,
            type: this.type,
            description: this.description,
            address: this.address,
            phone: this.phone,
            email: this.email,
            latitude: this.latitude,
            longitude: this.longitude,
            timezone: this.timezone,
            parentBranchId: this.parentBranchId,
            managerId: this.managerId,
            currency: this.currency,
            operatingHours: this.operatingHours,
            settings: this.settings,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

// ============================================================================
// Branch Permission Types
// ============================================================================

export type PermissionLevel = 'VIEW' | 'EDIT' | 'MANAGE' | 'ADMIN';

export interface BranchPermissionProps {
    id?: string;
    tenantId: string;
    userId: string;
    branchId: string;
    permissionLevel?: PermissionLevel;
    
    // Granular permissions
    canViewLeads?: boolean;
    canEditLeads?: boolean;
    canViewBookings?: boolean;
    canEditBookings?: boolean;
    canViewInventory?: boolean;
    canEditInventory?: boolean;
    canViewStaff?: boolean;
    canEditStaff?: boolean;
    canViewReports?: boolean;
    canViewFinancials?: boolean;
    
    // Metadata
    grantedBy?: string;
    grantedAt?: Date;
    expiresAt?: Date;
    isActive?: boolean;
    
    createdAt?: Date;
    updatedAt?: Date;
}

export class BranchPermission {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly userId: string;
    public readonly branchId: string;
    public readonly permissionLevel: PermissionLevel;
    
    public readonly canViewLeads: boolean;
    public readonly canEditLeads: boolean;
    public readonly canViewBookings: boolean;
    public readonly canEditBookings: boolean;
    public readonly canViewInventory: boolean;
    public readonly canEditInventory: boolean;
    public readonly canViewStaff: boolean;
    public readonly canEditStaff: boolean;
    public readonly canViewReports: boolean;
    public readonly canViewFinancials: boolean;
    
    public readonly grantedBy: string | null;
    public readonly grantedAt: Date;
    public readonly expiresAt: Date | null;
    public readonly isActive: boolean;
    
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<BranchPermissionProps>) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.userId = props.userId;
        this.branchId = props.branchId;
        this.permissionLevel = props.permissionLevel;
        this.canViewLeads = props.canViewLeads;
        this.canEditLeads = props.canEditLeads;
        this.canViewBookings = props.canViewBookings;
        this.canEditBookings = props.canEditBookings;
        this.canViewInventory = props.canViewInventory;
        this.canEditInventory = props.canEditInventory;
        this.canViewStaff = props.canViewStaff;
        this.canEditStaff = props.canEditStaff;
        this.canViewReports = props.canViewReports;
        this.canViewFinancials = props.canViewFinancials;
        this.grantedBy = props.grantedBy ?? null;
        this.grantedAt = props.grantedAt;
        this.expiresAt = props.expiresAt ?? null;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: BranchPermissionProps): BranchPermission {
        const isAdmin = props.permissionLevel === 'ADMIN';
        const isManage = props.permissionLevel === 'MANAGE' || isAdmin;
        const isEdit = props.permissionLevel === 'EDIT' || isManage;
        
        return new BranchPermission({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            userId: props.userId,
            branchId: props.branchId,
            permissionLevel: props.permissionLevel ?? 'VIEW',
            canViewLeads: props.canViewLeads ?? true,
            canEditLeads: props.canEditLeads ?? isEdit,
            canViewBookings: props.canViewBookings ?? true,
            canEditBookings: props.canEditBookings ?? isEdit,
            canViewInventory: props.canViewInventory ?? true,
            canEditInventory: props.canEditInventory ?? isEdit,
            canViewStaff: props.canViewStaff ?? true,
            canEditStaff: props.canEditStaff ?? isManage,
            canViewReports: props.canViewReports ?? true,
            canViewFinancials: props.canViewFinancials ?? isAdmin,
            grantedBy: props.grantedBy ?? null,
            grantedAt: props.grantedAt ?? new Date(),
            expiresAt: props.expiresAt ?? null,
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    /**
     * Check if the permission is currently valid
     */
    isValid(): boolean {
        if (!this.isActive) return false;
        if (this.expiresAt && this.expiresAt < new Date()) return false;
        return true;
    }
}

// ============================================================================
// Branch Transfer Types
// ============================================================================

export type TransferType = 'EMPLOYEE' | 'RESOURCE' | 'GEAR' | 'INVENTORY' | 'LEAD';
export type TransferStatus = 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export interface BranchTransferProps {
    id?: string;
    tenantId: string;
    transferType: TransferType;
    referenceId: string;
    referenceCode?: string;
    fromBranchId: string;
    toBranchId: string;
    status?: TransferStatus;
    reason?: string;
    notes?: string;
    requestedBy?: string;
    approvedBy?: string;
    completedBy?: string;
    requestedAt?: Date;
    approvedAt?: Date;
    completedAt?: Date;
    effectiveDate?: Date;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export class BranchTransfer {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly transferType: TransferType;
    public readonly referenceId: string;
    public readonly referenceCode: string | null;
    public readonly fromBranchId: string;
    public readonly toBranchId: string;
    public readonly status: TransferStatus;
    public readonly reason: string | null;
    public readonly notes: string | null;
    public readonly requestedBy: string | null;
    public readonly approvedBy: string | null;
    public readonly completedBy: string | null;
    public readonly requestedAt: Date;
    public readonly approvedAt: Date | null;
    public readonly completedAt: Date | null;
    public readonly effectiveDate: Date | null;
    public readonly metadata: Record<string, unknown>;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<BranchTransferProps>) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.transferType = props.transferType;
        this.referenceId = props.referenceId;
        this.referenceCode = props.referenceCode ?? null;
        this.fromBranchId = props.fromBranchId;
        this.toBranchId = props.toBranchId;
        this.status = props.status;
        this.reason = props.reason ?? null;
        this.notes = props.notes ?? null;
        this.requestedBy = props.requestedBy ?? null;
        this.approvedBy = props.approvedBy ?? null;
        this.completedBy = props.completedBy ?? null;
        this.requestedAt = props.requestedAt;
        this.approvedAt = props.approvedAt ?? null;
        this.completedAt = props.completedAt ?? null;
        this.effectiveDate = props.effectiveDate ?? null;
        this.metadata = props.metadata;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: BranchTransferProps): BranchTransfer {
        return new BranchTransfer({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            transferType: props.transferType,
            referenceId: props.referenceId,
            referenceCode: props.referenceCode ?? null,
            fromBranchId: props.fromBranchId,
            toBranchId: props.toBranchId,
            status: props.status ?? 'PENDING',
            reason: props.reason ?? null,
            notes: props.notes ?? null,
            requestedBy: props.requestedBy ?? null,
            approvedBy: props.approvedBy ?? null,
            completedBy: props.completedBy ?? null,
            requestedAt: props.requestedAt ?? new Date(),
            approvedAt: props.approvedAt ?? null,
            completedAt: props.completedAt ?? null,
            effectiveDate: props.effectiveDate ?? null,
            metadata: props.metadata ?? {},
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    /**
     * Check if transfer can be approved
     */
    canApprove(): boolean {
        return this.status === 'PENDING';
    }

    /**
     * Check if transfer can be completed
     */
    canComplete(): boolean {
        return this.status === 'APPROVED' || this.status === 'IN_TRANSIT';
    }

    /**
     * Check if transfer can be cancelled
     */
    canCancel(): boolean {
        return this.status === 'PENDING' || this.status === 'APPROVED';
    }
}
