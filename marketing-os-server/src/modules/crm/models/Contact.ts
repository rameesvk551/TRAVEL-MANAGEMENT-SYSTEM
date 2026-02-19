
export interface ContactProps {
    id: string;
    tenantId: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    // Add other properties as needed
}

export class Contact {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly firstName: string;
    public readonly lastName?: string;
    public readonly phone?: string;
    public readonly whatsapp?: string;
    public readonly email?: string;
    public readonly tags?: string[];
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;

    private constructor(props: ContactProps) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.firstName = props.firstName;
        this.lastName = props.lastName;
        this.phone = props.phone;
        this.whatsapp = props.whatsapp;
        this.email = props.email;
        this.tags = props.tags;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: ContactProps): Contact {
        return new Contact(props);
    }

    get fullName(): string {
        return `${this.firstName} ${this.lastName || ''}`.trim();
    }
}
