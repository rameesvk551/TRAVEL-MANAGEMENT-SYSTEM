export interface Lead {
    id: string;
    tenantId: string;
    name: string;
    phone?: string;
    email?: string;
    status: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
}
