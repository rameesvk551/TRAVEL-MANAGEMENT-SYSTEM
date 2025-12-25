/**
 * Database Link Utility
 * 
 * This utility provides helper functions to link structured data in PostgreSQL
 * with unstructured/extended data in MongoDB.
 * 
 * Pattern: Each MongoDB document has a reference field (e.g., tenant_id, user_id)
 * that matches the UUID primary key of the corresponding PostgreSQL record.
 */

import { TenantSettings, ITenantSettings } from './mongoose/models/TenantSettings.js';
import { UserProfile, IUserProfile } from './mongoose/models/UserProfile.js';
import { BranchSettings, IBranchSettings } from './mongoose/models/BranchSettings.js';
import { ContactExtended, IContactExtended } from './mongoose/models/ContactExtended.js';
import { LeadExtended, ILeadExtended } from './mongoose/models/LeadExtended.js';
import { BookingExtended, IBookingExtended } from './mongoose/models/BookingExtended.js';
import { ResourceAttributes, IResourceAttributes } from './mongoose/models/ResourceAttributes.js';
import { EmployeeExtended, IEmployeeExtended } from './mongoose/models/EmployeeExtended.js';

/**
 * Get or create extended data for a tenant
 */
export async function getTenantSettings(tenantId: string): Promise<ITenantSettings | null> {
    return TenantSettings.findOne({ tenant_id: tenantId });
}

export async function upsertTenantSettings(
    tenantId: string,
    data: Partial<ITenantSettings>
): Promise<ITenantSettings> {
    return TenantSettings.findOneAndUpdate(
        { tenant_id: tenantId },
        { ...data, tenant_id: tenantId },
        { upsert: true, new: true }
    );
}

/**
 * Get or create extended data for a user
 */
export async function getUserProfile(userId: string): Promise<IUserProfile | null> {
    return UserProfile.findOne({ user_id: userId });
}

export async function upsertUserProfile(
    userId: string,
    tenantId: string,
    data: Partial<IUserProfile>
): Promise<IUserProfile> {
    return UserProfile.findOneAndUpdate(
        { user_id: userId },
        { ...data, user_id: userId, tenant_id: tenantId },
        { upsert: true, new: true }
    );
}

/**
 * Get or create extended data for a branch
 */
export async function getBranchSettings(branchId: string): Promise<IBranchSettings | null> {
    return BranchSettings.findOne({ branch_id: branchId });
}

export async function upsertBranchSettings(
    branchId: string,
    tenantId: string,
    data: Partial<IBranchSettings>
): Promise<IBranchSettings> {
    return BranchSettings.findOneAndUpdate(
        { branch_id: branchId },
        { ...data, branch_id: branchId, tenant_id: tenantId },
        { upsert: true, new: true }
    );
}

/**
 * Get or create extended data for a contact
 */
export async function getContactExtended(contactId: string): Promise<IContactExtended | null> {
    return ContactExtended.findOne({ contact_id: contactId });
}

export async function upsertContactExtended(
    contactId: string,
    tenantId: string,
    data: Partial<IContactExtended>
): Promise<IContactExtended> {
    return ContactExtended.findOneAndUpdate(
        { contact_id: contactId },
        { ...data, contact_id: contactId, tenant_id: tenantId },
        { upsert: true, new: true }
    );
}

/**
 * Get or create extended data for a lead
 */
export async function getLeadExtended(leadId: string): Promise<ILeadExtended | null> {
    return LeadExtended.findOne({ lead_id: leadId });
}

export async function upsertLeadExtended(
    leadId: string,
    tenantId: string,
    data: Partial<ILeadExtended>
): Promise<ILeadExtended> {
    return LeadExtended.findOneAndUpdate(
        { lead_id: leadId },
        { ...data, lead_id: leadId, tenant_id: tenantId },
        { upsert: true, new: true }
    );
}

/**
 * Get or create extended data for a booking
 */
export async function getBookingExtended(bookingId: string): Promise<IBookingExtended | null> {
    return BookingExtended.findOne({ booking_id: bookingId });
}

export async function upsertBookingExtended(
    bookingId: string,
    tenantId: string,
    data: Partial<IBookingExtended>
): Promise<IBookingExtended> {
    return BookingExtended.findOneAndUpdate(
        { booking_id: bookingId },
        { ...data, booking_id: bookingId, tenant_id: tenantId },
        { upsert: true, new: true }
    );
}

/**
 * Get or create extended data for a resource
 */
export async function getResourceAttributes(resourceId: string): Promise<IResourceAttributes | null> {
    return ResourceAttributes.findOne({ resource_id: resourceId });
}

export async function upsertResourceAttributes(
    resourceId: string,
    tenantId: string,
    data: Partial<IResourceAttributes>
): Promise<IResourceAttributes> {
    return ResourceAttributes.findOneAndUpdate(
        { resource_id: resourceId },
        { ...data, resource_id: resourceId, tenant_id: tenantId },
        { upsert: true, new: true }
    );
}

/**
 * Get or create extended data for an employee
 */
export async function getEmployeeExtended(employeeId: string): Promise<IEmployeeExtended | null> {
    return EmployeeExtended.findOne({ employee_id: employeeId });
}

export async function upsertEmployeeExtended(
    employeeId: string,
    tenantId: string,
    data: Partial<IEmployeeExtended>
): Promise<IEmployeeExtended> {
    return EmployeeExtended.findOneAndUpdate(
        { employee_id: employeeId },
        { ...data, employee_id: employeeId, tenant_id: tenantId },
        { upsert: true, new: true }
    );
}

/**
 * Delete extended data when the primary record is deleted
 */
export async function deleteTenantSettings(tenantId: string): Promise<void> {
    await TenantSettings.deleteOne({ tenant_id: tenantId });
}

export async function deleteUserProfile(userId: string): Promise<void> {
    await UserProfile.deleteOne({ user_id: userId });
}

export async function deleteBranchSettings(branchId: string): Promise<void> {
    await BranchSettings.deleteOne({ branch_id: branchId });
}

export async function deleteContactExtended(contactId: string): Promise<void> {
    await ContactExtended.deleteOne({ contact_id: contactId });
}

export async function deleteLeadExtended(leadId: string): Promise<void> {
    await LeadExtended.deleteOne({ lead_id: leadId });
}

export async function deleteBookingExtended(bookingId: string): Promise<void> {
    await BookingExtended.deleteOne({ booking_id: bookingId });
}

export async function deleteResourceAttributes(resourceId: string): Promise<void> {
    await ResourceAttributes.deleteOne({ resource_id: resourceId });
}

export async function deleteEmployeeExtended(employeeId: string): Promise<void> {
    await EmployeeExtended.deleteOne({ employee_id: employeeId });
}
