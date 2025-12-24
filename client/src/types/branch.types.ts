// ============================================================================
// Branch Types for Multi-Branch System
// ============================================================================

export type BranchType = 'HEAD_OFFICE' | 'REGIONAL_OFFICE' | 'OFFICE' | 'WAREHOUSE' | 'OPERATIONAL_BASE';
export type PermissionLevel = 'VIEW' | 'EDIT' | 'MANAGE' | 'ADMIN';
export type TransferType = 'EMPLOYEE' | 'RESOURCE' | 'GEAR' | 'INVENTORY' | 'LEAD';
export type TransferStatus = 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

// ============================================================================
// Branch Address
// ============================================================================

export interface BranchAddress {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

// ============================================================================
// Branch Operating Hours
// ============================================================================

export interface DayHours {
    open: string;
    close: string;
}

export interface BranchOperatingHours {
    monday?: DayHours;
    tuesday?: DayHours;
    wednesday?: DayHours;
    thursday?: DayHours;
    friday?: DayHours;
    saturday?: DayHours;
    sunday?: DayHours;
}

// ============================================================================
// Branch Settings
// ============================================================================

export interface BranchSettings {
    allowBookings?: boolean;
    allowLeads?: boolean;
    defaultCurrency?: string;
    taxRate?: number;
    bookingPrefix?: string;
    [key: string]: unknown;
}

// ============================================================================
// Branch Entity
// ============================================================================

export interface Branch {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    type: BranchType;
    description?: string | null;
    
    // Address
    address: BranchAddress;
    
    // Contact
    phone?: string | null;
    email?: string | null;
    
    // Location
    latitude?: number | null;
    longitude?: number | null;
    timezone: string;
    
    // Hierarchy
    parentBranchId?: string | null;
    managerId?: string | null;
    
    // Configuration
    currency: string;
    operatingHours: BranchOperatingHours;
    settings: BranchSettings;
    
    // Status
    isActive: boolean;
    
    // Timestamps
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Branch with Statistics
// ============================================================================

export interface BranchWithStats extends Branch {
    employeeCount?: number;
    resourceCount?: number;
    activeBookingsCount?: number;
    monthlyRevenue?: number;
}

// ============================================================================
// Branch with Children (Hierarchy)
// ============================================================================

export interface BranchWithChildren extends Branch {
    children: BranchWithChildren[];
}

// ============================================================================
// Branch Permission
// ============================================================================

export interface BranchPermission {
    id: string;
    tenantId: string;
    userId: string;
    branchId: string;
    permissionLevel: PermissionLevel;
    
    // Granular permissions
    canViewLeads: boolean;
    canEditLeads: boolean;
    canViewBookings: boolean;
    canEditBookings: boolean;
    canViewInventory: boolean;
    canEditInventory: boolean;
    canViewStaff: boolean;
    canEditStaff: boolean;
    canViewReports: boolean;
    canViewFinancials: boolean;
    
    // Metadata
    grantedBy?: string | null;
    grantedAt: string;
    expiresAt?: string | null;
    isActive: boolean;
    
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Branch Transfer
// ============================================================================

export interface BranchTransfer {
    id: string;
    tenantId: string;
    transferType: TransferType;
    referenceId: string;
    referenceCode?: string | null;
    fromBranchId: string;
    toBranchId: string;
    status: TransferStatus;
    reason?: string | null;
    notes?: string | null;
    requestedBy?: string | null;
    approvedBy?: string | null;
    completedBy?: string | null;
    requestedAt: string;
    approvedAt?: string | null;
    completedAt?: string | null;
    effectiveDate?: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateBranchInput {
    name: string;
    code: string;
    type?: BranchType;
    description?: string;
    address?: BranchAddress;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    parentBranchId?: string;
    managerId?: string;
    currency?: string;
    operatingHours?: BranchOperatingHours;
    settings?: BranchSettings;
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
    isActive?: boolean;
}

export interface GrantPermissionInput {
    userId: string;
    permissionLevel: PermissionLevel;
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
    expiresAt?: string;
}

export interface CreateTransferInput {
    transferType: TransferType;
    referenceId: string;
    referenceCode?: string;
    fromBranchId: string;
    toBranchId: string;
    reason?: string;
    notes?: string;
    effectiveDate?: string;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// List Parameters
// ============================================================================

export interface BranchListParams {
    type?: BranchType;
    isActive?: boolean;
    parentBranchId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    includeStats?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface BranchListResponse {
    data: Branch[];
    pagination?: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export interface BranchHierarchyResponse {
    data: BranchWithChildren[];
}

// ============================================================================
// Branch Context (for global state)
// ============================================================================

export interface BranchContextState {
    currentBranch: Branch | null;
    accessibleBranches: Branch[];
    isLoading: boolean;
    error: string | null;
}

// ============================================================================
// Branch Filter State
// ============================================================================

export interface BranchFilterState {
    selectedBranchId: string | null; // null = all branches
    showInactive: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

export const getBranchTypeLabel = (type: BranchType): string => {
    const labels: Record<BranchType, string> = {
        HEAD_OFFICE: 'Head Office',
        REGIONAL_OFFICE: 'Regional Office',
        OFFICE: 'Office',
        WAREHOUSE: 'Warehouse',
        OPERATIONAL_BASE: 'Operational Base',
    };
    return labels[type] || type;
};

export const getPermissionLevelLabel = (level: PermissionLevel): string => {
    const labels: Record<PermissionLevel, string> = {
        VIEW: 'View Only',
        EDIT: 'Can Edit',
        MANAGE: 'Manager',
        ADMIN: 'Administrator',
    };
    return labels[level] || level;
};

export const getTransferStatusLabel = (status: TransferStatus): string => {
    const labels: Record<TransferStatus, string> = {
        PENDING: 'Pending Approval',
        APPROVED: 'Approved',
        IN_TRANSIT: 'In Transit',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
        REJECTED: 'Rejected',
    };
    return labels[status] || status;
};

export const getTransferStatusColor = (status: TransferStatus): string => {
    const colors: Record<TransferStatus, string> = {
        PENDING: 'yellow',
        APPROVED: 'blue',
        IN_TRANSIT: 'purple',
        COMPLETED: 'green',
        CANCELLED: 'gray',
        REJECTED: 'red',
    };
    return colors[status] || 'gray';
};

export const getTransferTypeLabel = (type: TransferType): string => {
    const labels: Record<TransferType, string> = {
        EMPLOYEE: 'Employee',
        RESOURCE: 'Resource/Tour',
        GEAR: 'Gear/Equipment',
        INVENTORY: 'Inventory',
        LEAD: 'Lead',
    };
    return labels[type] || type;
};
