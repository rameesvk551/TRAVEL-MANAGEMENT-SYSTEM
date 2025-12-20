import { Contact, ContactProps } from '../../domain/entities/Contact.js';
import { ContactRepository } from '../../infrastructure/repositories/ContactRepository.js';
import { ContactFilters } from '../../domain/interfaces/IContactRepository.js';

export class ContactService {
    constructor(private contactRepository: ContactRepository) { }

    async createOrUpdateContact(props: ContactProps): Promise<Contact> {
        // 1. Check for duplicates by Email
        if (props.email) {
            const existingEmail = await this.contactRepository.findByEmail(props.email, props.tenantId);
            if (existingEmail) {
                return this.updateContact(existingEmail.id, props);
            }
        }

        // 2. Check for duplicates by Phone
        if (props.phone) {
            const existingPhone = await this.contactRepository.findByPhone(props.phone, props.tenantId);
            if (existingPhone) {
                return this.updateContact(existingPhone.id, props);
            }
        }

        // 3. Create new
        const newContact = Contact.create(props);
        return this.contactRepository.save(newContact);
    }

    async updateContact(id: string, props: Partial<ContactProps>): Promise<Contact> {
        const existing = await this.contactRepository.findById(id, props.tenantId!);
        if (!existing) {
            throw new Error('Contact not found');
        }

        // Merge logic could be more complex (e.g. merge tags), but for now:
        const updated = Contact.create({
            ...existing, // Spread getters/props? No, Contact is a class. Need to extract props.
            // Actually, we should use a copy method or just create new with spread props if they were public.
            // Since props are spread in constructor, we can reconstruct.
            id: existing.id,
            tenantId: existing.tenantId,
            firstName: props.firstName ?? existing.firstName,
            lastName: props.lastName ?? existing.lastName,
            email: props.email ?? existing.email,
            phone: props.phone ?? existing.phone,
            whatsapp: props.whatsapp ?? existing.whatsapp,
            tags: props.tags ? [...new Set([...existing.tags, ...props.tags])] : existing.tags,
            travelHistory: { ...existing.travelHistory, ...props.travelHistory },
            preferences: { ...existing.preferences, ...props.preferences },
            marketingConsent: props.marketingConsent ?? existing.marketingConsent,
            socialHandles: { ...existing.socialHandles, ...props.socialHandles },
            createdAt: existing.createdAt,
            updatedAt: new Date()
        });

        return this.contactRepository.save(updated);
    }

    async getContact(id: string, tenantId: string): Promise<Contact | null> {
        return this.contactRepository.findById(id, tenantId);
    }

    async getContacts(tenantId: string, filters: ContactFilters) {
        return this.contactRepository.findAll(tenantId, filters);
    }
}
