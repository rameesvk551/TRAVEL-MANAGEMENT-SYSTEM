import mongoose, { Schema, Document } from 'mongoose';

export interface IFlow extends Document {
    tenantId: string;
    name: string;
    description?: string;
    triggerKeywords: string[];
    triggerType: string;
    isActive: boolean;
    isDefault: boolean;
    priority: number;
    nodes: Array<Record<string, any>>;
    startNodeId: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const FlowSchema = new Schema<IFlow>(
    {
        tenantId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        description: { type: String },
        triggerKeywords: { type: [String], default: [] },
        triggerType: { type: String, default: 'keyword' },
        isActive: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false },
        priority: { type: Number, default: 0 },
        nodes: { type: [Schema.Types.Mixed], default: [] },
        startNodeId: { type: String, required: true },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    {
        timestamps: true,
    }
);

export const Flow = mongoose.model<IFlow>('Flow', FlowSchema);
