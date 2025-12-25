import mongoose, { Document, Schema } from 'mongoose';

export interface ILeadExtended extends Document {
    lead_id: string;
    tenant_id: string;
    tags: string[];
    inquiry_details: {
        destination?: string;
        travel_dates?: {
            start?: Date;
            end?: Date;
            flexible?: boolean;
        };
        group_size?: number;
        budget?: {
            min?: number;
            max?: number;
            currency?: string;
        };
        special_requests?: string;
        source_campaign?: string;
    };
    travel_preferences: {
        accommodation_type?: string;
        travel_class?: string;
        dietary_requirements?: string[];
        interests?: string[];
        activity_level?: string;
    };
    metadata: {
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        landing_page?: string;
        referrer?: string;
        device?: string;
        browser?: string;
    };
    created_at: Date;
    updated_at: Date;
}

const LeadExtendedSchema = new Schema<ILeadExtended>(
    {
        lead_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        tags: [{ type: String }],
        inquiry_details: {
            destination: String,
            travel_dates: {
                start: Date,
                end: Date,
                flexible: Boolean,
            },
            group_size: Number,
            budget: {
                min: Number,
                max: Number,
                currency: String,
            },
            special_requests: String,
            source_campaign: String,
        },
        travel_preferences: {
            accommodation_type: String,
            travel_class: String,
            dietary_requirements: [String],
            interests: [String],
            activity_level: String,
        },
        metadata: {
            utm_source: String,
            utm_medium: String,
            utm_campaign: String,
            landing_page: String,
            referrer: String,
            device: String,
            browser: String,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const LeadExtended = mongoose.model<ILeadExtended>('LeadExtended', LeadExtendedSchema);
