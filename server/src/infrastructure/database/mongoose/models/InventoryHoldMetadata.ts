import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryHoldMetadata extends Document {
    hold_id: string;
    tenant_id: string;
    metadata: {
        customer_info?: {
            name?: string;
            email?: string;
            phone?: string;
        };
        payment_pending?: boolean;
        conversion_source?: string;
        custom_fields?: Record<string, unknown>;
    };
    created_at: Date;
    updated_at: Date;
}

const InventoryHoldMetadataSchema = new Schema<IInventoryHoldMetadata>(
    {
        hold_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        metadata: {
            customer_info: {
                name: String,
                email: String,
                phone: String,
            },
            payment_pending: Boolean,
            conversion_source: String,
            custom_fields: Schema.Types.Mixed,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const InventoryHoldMetadata = mongoose.model<IInventoryHoldMetadata>('InventoryHoldMetadata', InventoryHoldMetadataSchema);
