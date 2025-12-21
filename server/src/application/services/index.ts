export { ResourceService } from './ResourceService.js';
export { TenantService } from './TenantService.js';
export { AuthService, type RegisterDTO, type LoginDTO, type AuthResponse } from './AuthService.js';
export { AvailabilityService } from './AvailabilityService.js';
export { BookingService, type CreateBookingDTO } from './BookingService.js';
export { DashboardService } from './DashboardService.js';
export { LeadService } from './LeadService.js';
export { ContactService } from './ContactService.js';
export { PipelineService } from './PipelineService.js';

// Inventory Management Services
export { InventoryService, type CreateDepartureDTO, type DepartureWithInventory } from './InventoryService.js';
export { HoldService, type CreateHoldDTO, type ActiveHold } from './HoldService.js';
export {
    BookingOrchestrator,
    type InitiateBookingDTO,
    type BookingInitResult,
    type BookingLifecycleStatus,
    type GuestDetails,
} from './BookingOrchestrator.js';
