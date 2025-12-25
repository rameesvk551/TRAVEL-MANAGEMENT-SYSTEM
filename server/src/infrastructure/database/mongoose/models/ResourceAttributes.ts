import mongoose, { Document, Schema } from 'mongoose';

export interface IResourceAttributes extends Document {
    resource_id: string;
    tenant_id: string;
    accessible_branches: string[];
    attributes: {
        difficulty_level?: string;
        duration_hours?: number;
        included_items?: string[];
        excluded_items?: string[];
        requirements?: string[];
        meeting_point?: {
            address?: string;
            coordinates?: {
                lat: number;
                lng: number;
            };
        };
        itinerary?: Array<{
            day: number;
            title: string;
            description: string;
            activities: string[];
        }>;
        images?: Array<{
            url: string;
            alt?: string;
            is_primary?: boolean;
        }>;
        amenities?: string[];
        policies?: {
            cancellation?: string;
            refund?: string;
            age_restriction?: string;
        };
        custom_fields?: Record<string, unknown>;
    };
    created_at: Date;
    updated_at: Date;
}

const ResourceAttributesSchema = new Schema<IResourceAttributes>(
    {
        resource_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        accessible_branches: [{ type: String }],
        attributes: {
            difficulty_level: String,
            duration_hours: Number,
            included_items: [String],
            excluded_items: [String],
            requirements: [String],
            meeting_point: {
                address: String,
                coordinates: {
                    lat: Number,
                    lng: Number,
                },
            },
            itinerary: [{
                day: Number,
                title: String,
                description: String,
                activities: [String],
            }],
            images: [{
                url: String,
                alt: String,
                is_primary: Boolean,
            }],
            amenities: [String],
            policies: {
                cancellation: String,
                refund: String,
                age_restriction: String,
            },
            custom_fields: Schema.Types.Mixed,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const ResourceAttributes = mongoose.model<IResourceAttributes>('ResourceAttributes', ResourceAttributesSchema);
