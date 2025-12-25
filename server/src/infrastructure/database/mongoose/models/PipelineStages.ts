import mongoose, { Document, Schema } from 'mongoose';

export interface IPipelineStages extends Document {
    pipeline_id: string;
    tenant_id: string;
    stages: Array<{
        id: string;
        name: string;
        order: number;
        color?: string;
        probability?: number;
        is_won?: boolean;
        is_lost?: boolean;
        auto_actions?: Array<{
            type: string;
            config: Record<string, unknown>;
        }>;
    }>;
    created_at: Date;
    updated_at: Date;
}

const PipelineStagesSchema = new Schema<IPipelineStages>(
    {
        pipeline_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        stages: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            order: { type: Number, required: true },
            color: String,
            probability: Number,
            is_won: { type: Boolean, default: false },
            is_lost: { type: Boolean, default: false },
            auto_actions: [{
                type: String,
                config: Schema.Types.Mixed,
            }],
        }],
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const PipelineStages = mongoose.model<IPipelineStages>('PipelineStages', PipelineStagesSchema);
