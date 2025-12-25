import mongoose, { Document, Schema } from 'mongoose';

export interface IBranchSettings extends Document {
    branch_id: string;
    tenant_id: string;
    settings: {
        booking_confirmation_email?: boolean;
        auto_assign_leads?: boolean;
        default_currency?: string;
        tax_rate?: number;
    };
    operating_hours: {
        monday?: { open: string; close: string; closed?: boolean };
        tuesday?: { open: string; close: string; closed?: boolean };
        wednesday?: { open: string; close: string; closed?: boolean };
        thursday?: { open: string; close: string; closed?: boolean };
        friday?: { open: string; close: string; closed?: boolean };
        saturday?: { open: string; close: string; closed?: boolean };
        sunday?: { open: string; close: string; closed?: boolean };
    };
    custom_fields: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

const BranchSettingsSchema = new Schema<IBranchSettings>(
    {
        branch_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        settings: {
            booking_confirmation_email: { type: Boolean, default: true },
            auto_assign_leads: { type: Boolean, default: false },
            default_currency: { type: String, default: 'USD' },
            tax_rate: Number,
        },
        operating_hours: {
            monday: { open: String, close: String, closed: Boolean },
            tuesday: { open: String, close: String, closed: Boolean },
            wednesday: { open: String, close: String, closed: Boolean },
            thursday: { open: String, close: String, closed: Boolean },
            friday: { open: String, close: String, closed: Boolean },
            saturday: { open: String, close: String, closed: Boolean },
            sunday: { open: String, close: String, closed: Boolean },
        },
        custom_fields: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const BranchSettings = mongoose.model<IBranchSettings>('BranchSettings', BranchSettingsSchema);
