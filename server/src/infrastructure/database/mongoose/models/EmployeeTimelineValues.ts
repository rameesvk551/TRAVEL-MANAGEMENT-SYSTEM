import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeTimelineValues extends Document {
    timeline_id: string;
    tenant_id: string;
    previous_value: Record<string, unknown>;
    new_value: Record<string, unknown>;
    created_at: Date;
}

const EmployeeTimelineValuesSchema = new Schema<IEmployeeTimelineValues>(
    {
        timeline_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        previous_value: { type: Schema.Types.Mixed, default: {} },
        new_value: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export const EmployeeTimelineValues = mongoose.model<IEmployeeTimelineValues>('EmployeeTimelineValues', EmployeeTimelineValuesSchema);
