// Core Module
export * from './Tenant.js';
export * from './Branch.js';
export * from './User.js';

// CRM Module
export * from './Contact.js';
export * from './Pipeline.js';
export * from './Lead.js';
export * from './Activity.js';

// Inventory & Bookings Module
export * from './Resource.js';
export * from './DepartureInstance.js';
export * from './Booking.js';
export * from './InventoryHold.js';
export * from './Payment.js';

// HRMS Module
export * from './CostCenter.js';
export * from './Department.js';
export * from './Employee.js';
export * from './EmployeeTimeline.js';
export * from './Skill.js';
export * from './EmployeeSkill.js';
export * from './Document.js';
export * from './Attendance.js';
export * from './LeaveType.js';
export * from './LeaveBalance.js';
export * from './LeaveRequest.js';
export * from './TripAssignment.js';
export * from './Payroll.js';
export * from './SalaryAdvance.js';
export * from './Availability.js';
export * from './ExpenseClaim.js';
export * from './ExpenseItem.js';

// Vendor Module
export * from './Vendor.js';
export * from './VendorContract.js';
export * from './VendorRate.js';
export * from './VendorAssignment.js';
export * from './VendorPayable.js';
export * from './VendorSettlement.js';

// Gear Module
export * from './GearWarehouse.js';
export * from './GearCategory.js';
export * from './GearItem.js';
export * from './GearInventory.js';
export * from './GearAssignment.js';
export * from './GearRental.js';

// Accounting Module
export * from './Account.js';
export * from './JournalEntry.js';
export * from './JournalLine.js';
export * from './LedgerEntry.js';

// WhatsApp Module
export * from './WhatsappConversation.js';
export * from './WhatsappMessage.js';
export * from './WhatsappConversationEntity.js';
export * from './WhatsappTemplate.js';
export * from './WhatsappOptIn.js';

// Analytics & Reporting
export * from './UnifiedTimeline.js';
export * from './CustomMetric.js';
export * from './DashboardLayout.js';

// Associations
export { setupAssociations } from './associations.js';
