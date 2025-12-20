import { generateId } from '../../shared/utils/index.js';

export interface ContactProps {
    id?: string;
    tenantId: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    firstName: string;
    lastName?: string;
    tags?: string[];
    travelHistory?: Record<string, unknown>; // Metadata about past trips
    preferences?: Record<string, unknown>; // Diet, Activity Levels, etc.
    marketingConsent?: boolean;
    socialHandles?: Record<string, string>; // { instagram: '@user', facebook: '...' }
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Contact Entity - Unified profile for a human entity across Leads and Bookings.
 * Ops-first: Stores strict identity data + diverse metadata.
 */
export class Contact {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly email?: string;
    public readonly phone?: string;
    public readonly whatsapp?: string;
    public readonly firstName: string;
    public readonly lastName?: string;
    public readonly tags: string[];
    public readonly travelHistory: Record<string, unknown>;
    public readonly preferences: Record<string, unknown>;
    public readonly marketingConsent: boolean;
    public readonly socialHandles: Record<string, string>;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: ContactProps) {
        this.id = props.id!;
        this.tenantId = props.tenantId;
        this.email = props.email;
        this.phone = props.phone;
        this.whatsapp = props.whatsapp;
        this.firstName = props.firstName;
        this.lastName = props.lastName;
        this.tags = props.tags!;
        this.travelHistory = props.travelHistory!;
        this.preferences = props.preferences!;
        this.marketingConsent = props.marketingConsent!;
        this.socialHandles = props.socialHandles!;
        this.createdAt = props.createdAt!;
        this.updatedAt = props.updatedAt!;
    }

    static create(props: ContactProps): Contact {
        const now = new Date();
        return new Contact({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            email: props.email?.toLowerCase(),
            phone: props.phone,
            whatsapp: props.whatsapp,
            firstName: props.firstName,
            lastName: props.lastName,
            tags: props.tags ?? [],
            travelHistory: props.travelHistory ?? {},
            preferences: props.preferences ?? {},
            marketingConsent: props.marketingConsent ?? false,
            socialHandles: props.socialHandles ?? {},
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }

    static fromPersistence(data: ContactProps): Contact {
        return new Contact(data);
    }

    get fullName(): string {
        return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName;
    }
}
