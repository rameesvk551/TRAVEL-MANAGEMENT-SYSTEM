import mongoose, { Schema, Document } from 'mongoose';

export interface IFlow extends Document {
    tenantId: string;
    id: string; // Mongoose virtual
    name: string;
    description?: string;
    triggerType: 'keyword' | 'event';
    keywords?: string[];
    nodes: any[];
    edges: any[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FlowSchema: Schema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    triggerType: { type: String, enum: ['keyword', 'event'], default: 'keyword' },
    keywords: [{ type: String }],
    nodes: [{ type: Schema.Types.Mixed }], // Storing ReactFlow nodes as mixed JSON
    edges: [{ type: Schema.Types.Mixed }], // Storing ReactFlow edges as mixed JSON
    isActive: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

export const Flow = mongoose.model<IFlow>('Flow', FlowSchema);
