import mongoose, { Document, Schema } from 'mongoose';

export interface IContactExtended extends Document {
    contact_id: string;
    tenant_id: string;
    tags: string[];
    travel_history: Array<{
        destination?: string;
        date?: Date;
        booking_id?: string;
        trip_type?: string;
        notes?: string;
    }>;
    preferences: {
        preferred_destinations?: string[];
        dietary_requirements?: string[];
        accommodation_type?: string;
        travel_class?: string;
        special_needs?: string;
        interests?: string[];
    };
    social_handles: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
    };
    custom_fields: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

const ContactExtendedSchema = new Schema<IContactExtended>(
    {
        contact_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        tags: [{ type: String }],
        travel_history: [{
            destination: String,
            date: Date,
            booking_id: String,
            trip_type: String,
            notes: String,
        }],
        preferences: {
            preferred_destinations: [String],
            dietary_requirements: [String],
            accommodation_type: String,
            travel_class: String,
            special_needs: String,
            interests: [String],
        },
        social_handles: {
            facebook: String,
            instagram: String,
            twitter: String,
            linkedin: String,
        },
        custom_fields: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const ContactExtended = mongoose.model<IContactExtended>('ContactExtended', ContactExtendedSchema);
