import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingExtended extends Document {
    booking_id: string;
    tenant_id: string;
    additional_guests: Array<{
        name: string;
        email?: string;
        phone?: string;
        age?: number;
        special_requirements?: string;
        document_type?: string;
        document_number?: string;
    }>;
    metadata: {
        source_details?: {
            ota_booking_id?: string;
            agent_name?: string;
            commission_rate?: number;
        };
        special_requests?: string;
        dietary_requirements?: string[];
        pickup_details?: {
            location?: string;
            time?: string;
            contact?: string;
        };
        custom_fields?: Record<string, unknown>;
    };
    created_at: Date;
    updated_at: Date;
}

const BookingExtendedSchema = new Schema<IBookingExtended>(
    {
        booking_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        additional_guests: [{
            name: { type: String, required: true },
            email: String,
            phone: String,
            age: Number,
            special_requirements: String,
            document_type: String,
            document_number: String,
        }],
        metadata: {
            source_details: {
                ota_booking_id: String,
                agent_name: String,
                commission_rate: Number,
            },
            special_requests: String,
            dietary_requirements: [String],
            pickup_details: {
                location: String,
                time: String,
                contact: String,
            },
            custom_fields: Schema.Types.Mixed,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const BookingExtended = mongoose.model<IBookingExtended>('BookingExtended', BookingExtendedSchema);
