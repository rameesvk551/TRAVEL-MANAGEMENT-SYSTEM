export { type IResourceRepository, type ResourceFilters } from './IResourceRepository.js';
export { type IBookingRepository, type BookingFilters } from './IBookingRepository.js';
export { type ITenantRepository } from './ITenantRepository.js';
export { type IUserRepository } from './IUserRepository.js';

// Inventory Management Interfaces
export {
    type IDepartureRepository,
    type InventoryState,
    type DepartureFilter,
    type HoldResult,
} from './IDepartureRepository.js';

export {
    type IPaymentRepository,
    type BookingPaymentSummary,
    type CreatePaymentLinkParams,
    type PaymentLinkResult,
} from './IPaymentRepository.js';
