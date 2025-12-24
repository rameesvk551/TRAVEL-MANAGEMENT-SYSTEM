export { Tenant, type TenantProps } from './Tenant.js';
export { User, type UserProps, type UserRole } from './User.js';
export { Resource, type ResourceProps, type ResourceType } from './Resource.js';
export {
    Booking,
    type BookingProps,
    type BookingSource,
    type BookingStatus,
} from './Booking.js';
export { Lead, type LeadProps } from './Lead.js';

// Branch Management Entities
export {
    Branch,
    type BranchProps,
    type BranchType,
    type BranchAddress,
    type BranchSettings,
    type BranchOperatingHours,
    BranchPermission,
    type BranchPermissionProps,
    type PermissionLevel,
    BranchTransfer,
    type BranchTransferProps,
    type TransferType,
    type TransferStatus,
} from './Branch.js';

// Inventory Management Entities
export {
    DepartureInstance,
    type DepartureInstanceProps,
    type DepartureStatus,
} from './DepartureInstance.js';

export {
    InventoryHold,
    type InventoryHoldProps,
    type HoldSource,
    type HoldType,
    type ReleaseReason,
    HOLD_TTL,
} from './InventoryHold.js';

export {
    Payment,
    type PaymentProps,
    type PaymentType,
    type PaymentMethod,
    type PaymentStatus,
    type PaymentGateway,
} from './Payment.js';
