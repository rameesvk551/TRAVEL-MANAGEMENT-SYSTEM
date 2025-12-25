import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProfile extends Document {
    user_id: string;
    tenant_id: string;
    avatar_url?: string;
    phone?: string;
    address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        country?: string;
        postal_code?: string;
    };
    preferences: {
        language?: string;
        timezone?: string;
        date_format?: string;
        notifications?: {
            email?: boolean;
            push?: boolean;
            sms?: boolean;
        };
    };
    accessible_branches: string[];
    custom_fields: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
    {
        user_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        avatar_url: String,
        phone: String,
        address: {
            line1: String,
            line2: String,
            city: String,
            state: String,
            country: String,
            postal_code: String,
        },
        preferences: {
            language: { type: String, default: 'en' },
            timezone: String,
            date_format: { type: String, default: 'YYYY-MM-DD' },
            notifications: {
                email: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
            },
        },
        accessible_branches: [{ type: String }],
        custom_fields: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
