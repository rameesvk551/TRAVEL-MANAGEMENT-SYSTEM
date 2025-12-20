import { Contact } from '../entities/Contact.js';
import { Pagination } from '../../shared/types/Pagination.js';

export interface ContactFilters extends Pagination {
    search?: string; // Search by name, email, phone
    tags?: string[];
}

export interface IContactRepository {
    save(contact: Contact): Promise<Contact>;
    findById(id: string, tenantId: string): Promise<Contact | null>;
    findByEmail(email: string, tenantId: string): Promise<Contact | null>;
    findByPhone(phone: string, tenantId: string): Promise<Contact | null>;
    findAll(tenantId: string, filters: ContactFilters): Promise<{ contacts: Contact[]; total: number }>;
    delete(id: string, tenantId: string): Promise<void>;
}
