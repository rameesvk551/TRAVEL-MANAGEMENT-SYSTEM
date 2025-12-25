import mongoose, { Document, Schema } from 'mongoose';

export interface ITenantSettings extends Document {
    tenant_id: string;
    branding: {
        logo_url?: string;
        primary_color?: string;
        secondary_color?: string;
    };
    features: {
        crm_enabled?: boolean;
        hrms_enabled?: boolean;
        inventory_enabled?: boolean;
        accounting_enabled?: boolean;
        whatsapp_enabled?: boolean;
    };
    integrations: {
        payment_gateway?: string;
        email_provider?: string;
        sms_provider?: string;
    };
    custom_fields: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

const TenantSettingsSchema = new Schema<ITenantSettings>(
    {
        tenant_id: { type: String, required: true, unique: true, index: true },
        branding: {
            logo_url: String,
            primary_color: String,
            secondary_color: String,
        },
        features: {
            crm_enabled: { type: Boolean, default: true },
            hrms_enabled: { type: Boolean, default: true },
            inventory_enabled: { type: Boolean, default: true },
            accounting_enabled: { type: Boolean, default: true },
            whatsapp_enabled: { type: Boolean, default: false },
        },
        integrations: {
            payment_gateway: String,
            email_provider: String,
            sms_provider: String,
        },
        custom_fields: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const TenantSettings = mongoose.model<ITenantSettings>('TenantSettings', TenantSettingsSchema);
