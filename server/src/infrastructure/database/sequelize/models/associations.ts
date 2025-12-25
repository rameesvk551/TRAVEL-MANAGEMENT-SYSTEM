import { Tenant } from './Tenant.js';
import { Branch } from './Branch.js';
import { User } from './User.js';
import { Contact } from './Contact.js';
import { Pipeline } from './Pipeline.js';
import { Lead } from './Lead.js';
import { Activity } from './Activity.js';
import { Resource } from './Resource.js';
import { DepartureInstance } from './DepartureInstance.js';
import { Booking } from './Booking.js';
import { InventoryHold } from './InventoryHold.js';
import { Payment } from './Payment.js';
import { CostCenter } from './CostCenter.js';
import { Department } from './Department.js';
import { Employee } from './Employee.js';
import { EmployeeTimeline } from './EmployeeTimeline.js';
import { Skill } from './Skill.js';
import { EmployeeSkill } from './EmployeeSkill.js';
import { Document } from './Document.js';
import { Attendance } from './Attendance.js';
import { LeaveType } from './LeaveType.js';
import { LeaveBalance } from './LeaveBalance.js';
import { LeaveRequest } from './LeaveRequest.js';
import { TripAssignment } from './TripAssignment.js';
import { Payroll } from './Payroll.js';
import { SalaryAdvance } from './SalaryAdvance.js';
import { Availability } from './Availability.js';
import { ExpenseClaim } from './ExpenseClaim.js';
import { ExpenseItem } from './ExpenseItem.js';
import { Vendor } from './Vendor.js';
import { VendorContract } from './VendorContract.js';
import { VendorRate } from './VendorRate.js';
import { VendorAssignment } from './VendorAssignment.js';
import { VendorPayable } from './VendorPayable.js';
import { VendorSettlement } from './VendorSettlement.js';
import { GearWarehouse } from './GearWarehouse.js';
import { GearCategory } from './GearCategory.js';
import { GearItem } from './GearItem.js';
import { GearInventory } from './GearInventory.js';
import { GearAssignment } from './GearAssignment.js';
import { GearRental } from './GearRental.js';
import { Account } from './Account.js';
import { JournalEntry } from './JournalEntry.js';
import { JournalLine } from './JournalLine.js';
import { LedgerEntry } from './LedgerEntry.js';
import { WhatsappConversation } from './WhatsappConversation.js';
import { WhatsappMessage } from './WhatsappMessage.js';
import { WhatsappConversationEntity } from './WhatsappConversationEntity.js';
import { WhatsappTemplate } from './WhatsappTemplate.js';
import { WhatsappOptIn } from './WhatsappOptIn.js';
import { UnifiedTimeline } from './UnifiedTimeline.js';
import { CustomMetric } from './CustomMetric.js';
import { DashboardLayout } from './DashboardLayout.js';

export function setupAssociations() {
    // Tenant -> Branches
    Tenant.hasMany(Branch, { foreignKey: 'tenant_id', as: 'branches' });
    Branch.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    // Tenant -> Users
    Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
    User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    // Branch -> Users
    Branch.hasMany(User, { foreignKey: 'branch_id', as: 'users' });
    User.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

    // Branch self-reference (parent)
    Branch.hasMany(Branch, { foreignKey: 'parent_branch_id', as: 'childBranches' });
    Branch.belongsTo(Branch, { foreignKey: 'parent_branch_id', as: 'parentBranch' });

    // Branch -> Manager (User)
    Branch.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

    // User -> Department
    User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

    // Contact -> Tenant/Branch
    Tenant.hasMany(Contact, { foreignKey: 'tenant_id', as: 'contacts' });
    Contact.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Branch.hasMany(Contact, { foreignKey: 'branch_id', as: 'contacts' });
    Contact.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

    // Pipeline -> Tenant
    Tenant.hasMany(Pipeline, { foreignKey: 'tenant_id', as: 'pipelines' });
    Pipeline.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    // Lead associations
    Tenant.hasMany(Lead, { foreignKey: 'tenant_id', as: 'leads' });
    Lead.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Branch.hasMany(Lead, { foreignKey: 'branch_id', as: 'leads' });
    Lead.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
    User.hasMany(Lead, { foreignKey: 'assigned_to_id', as: 'assignedLeads' });
    Lead.belongsTo(User, { foreignKey: 'assigned_to_id', as: 'assignedTo' });
    Contact.hasMany(Lead, { foreignKey: 'contact_id', as: 'leads' });
    Lead.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
    Pipeline.hasMany(Lead, { foreignKey: 'pipeline_id', as: 'leads' });
    Lead.belongsTo(Pipeline, { foreignKey: 'pipeline_id', as: 'pipeline' });

    // Activity associations
    Tenant.hasMany(Activity, { foreignKey: 'tenant_id', as: 'activities' });
    Activity.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Lead.hasMany(Activity, { foreignKey: 'lead_id', as: 'activities' });
    Activity.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
    Contact.hasMany(Activity, { foreignKey: 'contact_id', as: 'activities' });
    Activity.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
    Booking.hasMany(Activity, { foreignKey: 'booking_id', as: 'activities' });
    Activity.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

    // Resource associations
    Tenant.hasMany(Resource, { foreignKey: 'tenant_id', as: 'resources' });
    Resource.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Branch.hasMany(Resource, { foreignKey: 'branch_id', as: 'resources' });
    Resource.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

    // DepartureInstance associations
    Resource.hasMany(DepartureInstance, { foreignKey: 'resource_id', as: 'departures' });
    DepartureInstance.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });

    // Booking associations
    Tenant.hasMany(Booking, { foreignKey: 'tenant_id', as: 'bookings' });
    Booking.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Resource.hasMany(Booking, { foreignKey: 'resource_id', as: 'bookings' });
    Booking.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });
    DepartureInstance.hasMany(Booking, { foreignKey: 'departure_id', as: 'bookings' });
    Booking.belongsTo(DepartureInstance, { foreignKey: 'departure_id', as: 'departure' });
    Lead.hasMany(Booking, { foreignKey: 'lead_id', as: 'bookings' });
    Booking.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
    User.hasMany(Booking, { foreignKey: 'created_by_id', as: 'createdBookings' });
    Booking.belongsTo(User, { foreignKey: 'created_by_id', as: 'createdBy' });

    // InventoryHold associations
    DepartureInstance.hasMany(InventoryHold, { foreignKey: 'departure_id', as: 'holds' });
    InventoryHold.belongsTo(DepartureInstance, { foreignKey: 'departure_id', as: 'departure' });
    Booking.hasOne(InventoryHold, { foreignKey: 'booking_id', as: 'hold' });
    InventoryHold.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

    // Payment associations
    Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });
    Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
    User.hasMany(Payment, { foreignKey: 'received_by_id', as: 'receivedPayments' });
    Payment.belongsTo(User, { foreignKey: 'received_by_id', as: 'receivedBy' });

    // Department associations
    Department.hasMany(Department, { foreignKey: 'parent_id', as: 'childDepartments' });
    Department.belongsTo(Department, { foreignKey: 'parent_id', as: 'parentDepartment' });
    Department.belongsTo(Employee, { foreignKey: 'head_employee_id', as: 'head' });

    // CostCenter associations
    CostCenter.hasMany(CostCenter, { foreignKey: 'parent_id', as: 'childCostCenters' });
    CostCenter.belongsTo(CostCenter, { foreignKey: 'parent_id', as: 'parentCostCenter' });

    // Employee associations
    Tenant.hasMany(Employee, { foreignKey: 'tenant_id', as: 'employees' });
    Employee.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    User.hasOne(Employee, { foreignKey: 'user_id', as: 'employee' });
    Employee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    Branch.hasMany(Employee, { foreignKey: 'branch_id', as: 'employees' });
    Employee.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
    Department.hasMany(Employee, { foreignKey: 'department_id', as: 'employees' });
    Employee.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
    Employee.hasMany(Employee, { foreignKey: 'reporting_to', as: 'directReports' });
    Employee.belongsTo(Employee, { foreignKey: 'reporting_to', as: 'manager' });
    CostCenter.hasMany(Employee, { foreignKey: 'cost_center_id', as: 'employees' });
    Employee.belongsTo(CostCenter, { foreignKey: 'cost_center_id', as: 'costCenter' });

    // EmployeeTimeline associations
    Employee.hasMany(EmployeeTimeline, { foreignKey: 'employee_id', as: 'timeline' });
    EmployeeTimeline.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

    // EmployeeSkill associations
    Employee.hasMany(EmployeeSkill, { foreignKey: 'employee_id', as: 'skills' });
    EmployeeSkill.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
    Skill.hasMany(EmployeeSkill, { foreignKey: 'skill_id', as: 'employeeSkills' });
    EmployeeSkill.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });

    // Document associations
    Employee.hasMany(Document, { foreignKey: 'employee_id', as: 'documents' });
    Document.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

    // Attendance associations
    Employee.hasMany(Attendance, { foreignKey: 'employee_id', as: 'attendance' });
    Attendance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

    // Leave associations
    Employee.hasMany(LeaveBalance, { foreignKey: 'employee_id', as: 'leaveBalances' });
    LeaveBalance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
    LeaveType.hasMany(LeaveBalance, { foreignKey: 'leave_type_id', as: 'balances' });
    LeaveBalance.belongsTo(LeaveType, { foreignKey: 'leave_type_id', as: 'leaveType' });
    Employee.hasMany(LeaveRequest, { foreignKey: 'employee_id', as: 'leaveRequests' });
    LeaveRequest.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
    LeaveType.hasMany(LeaveRequest, { foreignKey: 'leave_type_id', as: 'requests' });
    LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leave_type_id', as: 'leaveType' });

    // TripAssignment associations
    DepartureInstance.hasMany(TripAssignment, { foreignKey: 'trip_id', as: 'assignments' });
    TripAssignment.belongsTo(DepartureInstance, { foreignKey: 'trip_id', as: 'trip' });
    Employee.hasMany(TripAssignment, { foreignKey: 'employee_id', as: 'tripAssignments' });
    TripAssignment.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

    // Payroll associations
    Employee.hasMany(Payroll, { foreignKey: 'employee_id', as: 'payrolls' });
    Payroll.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

    // SalaryAdvance associations
    Employee.hasMany(SalaryAdvance, { foreignKey: 'employee_id', as: 'salaryAdvances' });
    SalaryAdvance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

    // Availability associations
    Employee.hasMany(Availability, { foreignKey: 'employee_id', as: 'availability' });
    Availability.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

    // ExpenseClaim associations
    Employee.hasMany(ExpenseClaim, { foreignKey: 'employee_id', as: 'expenseClaims' });
    ExpenseClaim.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
    User.hasMany(ExpenseClaim, { foreignKey: 'reviewed_by', as: 'reviewedClaims' });
    ExpenseClaim.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });
    User.hasMany(ExpenseClaim, { foreignKey: 'approved_by', as: 'approvedClaims' });
    ExpenseClaim.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

    // ExpenseItem associations
    ExpenseClaim.hasMany(ExpenseItem, { foreignKey: 'claim_id', as: 'items' });
    ExpenseItem.belongsTo(ExpenseClaim, { foreignKey: 'claim_id', as: 'claim' });

    // Vendor associations
    Tenant.hasMany(Vendor, { foreignKey: 'tenant_id', as: 'vendors' });
    Vendor.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Vendor.hasMany(VendorContract, { foreignKey: 'vendor_id', as: 'contracts' });
    VendorContract.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    Vendor.hasMany(VendorRate, { foreignKey: 'vendor_id', as: 'rates' });
    VendorRate.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    VendorContract.hasMany(VendorRate, { foreignKey: 'contract_id', as: 'rates' });
    VendorRate.belongsTo(VendorContract, { foreignKey: 'contract_id', as: 'contract' });
    Vendor.hasMany(VendorAssignment, { foreignKey: 'vendor_id', as: 'assignments' });
    VendorAssignment.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    Vendor.hasMany(VendorPayable, { foreignKey: 'vendor_id', as: 'payables' });
    VendorPayable.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    VendorAssignment.hasMany(VendorPayable, { foreignKey: 'assignment_id', as: 'payables' });
    VendorPayable.belongsTo(VendorAssignment, { foreignKey: 'assignment_id', as: 'assignment' });
    Vendor.hasMany(VendorSettlement, { foreignKey: 'vendor_id', as: 'settlements' });
    VendorSettlement.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

    // Gear associations
    GearCategory.hasMany(GearCategory, { foreignKey: 'parent_id', as: 'childCategories' });
    GearCategory.belongsTo(GearCategory, { foreignKey: 'parent_id', as: 'parentCategory' });
    GearCategory.hasMany(GearItem, { foreignKey: 'category_id', as: 'items' });
    GearItem.belongsTo(GearCategory, { foreignKey: 'category_id', as: 'category' });
    GearWarehouse.hasMany(GearItem, { foreignKey: 'warehouse_id', as: 'items' });
    GearItem.belongsTo(GearWarehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
    Vendor.hasMany(GearItem, { foreignKey: 'vendor_id', as: 'gearItems' });
    GearItem.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    GearItem.hasOne(GearInventory, { foreignKey: 'gear_item_id', as: 'inventory' });
    GearInventory.belongsTo(GearItem, { foreignKey: 'gear_item_id', as: 'gearItem' });
    GearItem.hasMany(GearAssignment, { foreignKey: 'gear_item_id', as: 'assignments' });
    GearAssignment.belongsTo(GearItem, { foreignKey: 'gear_item_id', as: 'gearItem' });
    GearRental.hasMany(GearInventory, { foreignKey: 'rental_id', as: 'rentedItems' });
    GearInventory.belongsTo(GearRental, { foreignKey: 'rental_id', as: 'rental' });

    // Account associations
    Account.hasMany(Account, { foreignKey: 'parent_account_id', as: 'childAccounts' });
    Account.belongsTo(Account, { foreignKey: 'parent_account_id', as: 'parentAccount' });

    // JournalEntry associations
    Tenant.hasMany(JournalEntry, { foreignKey: 'tenant_id', as: 'journalEntries' });
    JournalEntry.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Branch.hasMany(JournalEntry, { foreignKey: 'branch_id', as: 'journalEntries' });
    JournalEntry.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
    User.hasMany(JournalEntry, { foreignKey: 'created_by', as: 'createdJournalEntries' });
    JournalEntry.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
    JournalEntry.hasMany(JournalLine, { foreignKey: 'journal_entry_id', as: 'lines' });
    JournalLine.belongsTo(JournalEntry, { foreignKey: 'journal_entry_id', as: 'journalEntry' });
    Account.hasMany(JournalLine, { foreignKey: 'account_id', as: 'journalLines' });
    JournalLine.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

    // LedgerEntry associations
    Account.hasMany(LedgerEntry, { foreignKey: 'account_id', as: 'ledgerEntries' });
    LedgerEntry.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });
    JournalEntry.hasMany(LedgerEntry, { foreignKey: 'journal_entry_id', as: 'ledgerEntries' });
    LedgerEntry.belongsTo(JournalEntry, { foreignKey: 'journal_entry_id', as: 'journalEntry' });

    // WhatsApp associations
    Tenant.hasMany(WhatsappConversation, { foreignKey: 'tenant_id', as: 'whatsappConversations' });
    WhatsappConversation.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    WhatsappConversation.hasMany(WhatsappMessage, { foreignKey: 'conversation_id', as: 'messages' });
    WhatsappMessage.belongsTo(WhatsappConversation, { foreignKey: 'conversation_id', as: 'conversation' });
    WhatsappConversation.hasMany(WhatsappConversationEntity, { foreignKey: 'conversation_id', as: 'entities' });
    WhatsappConversationEntity.belongsTo(WhatsappConversation, { foreignKey: 'conversation_id', as: 'conversation' });
    Lead.hasMany(WhatsappMessage, { foreignKey: 'linked_lead_id', as: 'whatsappMessages' });
    WhatsappMessage.belongsTo(Lead, { foreignKey: 'linked_lead_id', as: 'linkedLead' });
    Booking.hasMany(WhatsappMessage, { foreignKey: 'linked_booking_id', as: 'whatsappMessages' });
    WhatsappMessage.belongsTo(Booking, { foreignKey: 'linked_booking_id', as: 'linkedBooking' });

    // UnifiedTimeline associations
    Lead.hasMany(UnifiedTimeline, { foreignKey: 'lead_id', as: 'unifiedTimeline' });
    UnifiedTimeline.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
    Booking.hasMany(UnifiedTimeline, { foreignKey: 'booking_id', as: 'unifiedTimeline' });
    UnifiedTimeline.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
    DepartureInstance.hasMany(UnifiedTimeline, { foreignKey: 'departure_id', as: 'unifiedTimeline' });
    UnifiedTimeline.belongsTo(DepartureInstance, { foreignKey: 'departure_id', as: 'departure' });

    // DashboardLayout associations
    User.hasMany(DashboardLayout, { foreignKey: 'user_id', as: 'dashboardLayouts' });
    DashboardLayout.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
}
