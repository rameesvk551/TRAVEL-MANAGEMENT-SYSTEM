import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomMetricExpression extends Document {
    metric_id: string;
    tenant_id: string;
    expression: {
        type: string;
        formula?: string;
        aggregation?: string;
        fields?: string[];
        filters?: Array<{
            field: string;
            operator: string;
            value: unknown;
        }>;
        groupBy?: string[];
        orderBy?: string;
        limit?: number;
    };
    created_at: Date;
    updated_at: Date;
}

const CustomMetricExpressionSchema = new Schema<ICustomMetricExpression>(
    {
        metric_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        expression: {
            type: String,
            formula: String,
            aggregation: String,
            fields: [String],
            filters: [{
                field: String,
                operator: String,
                value: Schema.Types.Mixed,
            }],
            groupBy: [String],
            orderBy: String,
            limit: Number,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const CustomMetricExpression = mongoose.model<ICustomMetricExpression>('CustomMetricExpression', CustomMetricExpressionSchema);
