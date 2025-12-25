import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartureInstanceAttributes extends Document {
    departure_id: string;
    tenant_id: string;
    attributes: {
        guide_notes?: string;
        weather_forecast?: string;
        special_instructions?: string;
        pickup_points?: Array<{
            location: string;
            time: string;
            notes?: string;
        }>;
        equipment_list?: string[];
        pricing_tiers?: Array<{
            name: string;
            price: number;
            description?: string;
        }>;
        custom_fields?: Record<string, unknown>;
    };
    created_at: Date;
    updated_at: Date;
}

const DepartureInstanceAttributesSchema = new Schema<IDepartureInstanceAttributes>(
    {
        departure_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        attributes: {
            guide_notes: String,
            weather_forecast: String,
            special_instructions: String,
            pickup_points: [{
                location: String,
                time: String,
                notes: String,
            }],
            equipment_list: [String],
            pricing_tiers: [{
                name: String,
                price: Number,
                description: String,
            }],
            custom_fields: Schema.Types.Mixed,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const DepartureInstanceAttributes = mongoose.model<IDepartureInstanceAttributes>('DepartureInstanceAttributes', DepartureInstanceAttributesSchema);
