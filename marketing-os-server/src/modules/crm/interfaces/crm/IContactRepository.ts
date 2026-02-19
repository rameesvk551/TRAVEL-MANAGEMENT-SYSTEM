import { Contact } from '../../models/Contact.js';

export interface IContactRepository {
    findByPhone(phone: string, tenantId: string): Promise<Contact | null>;
    create(data: Partial<Contact>): Promise<Contact>;
    search(tenantId: string, query: string): Promise<Contact[]>;
    findById(id: string): Promise<Contact | null>;
}
