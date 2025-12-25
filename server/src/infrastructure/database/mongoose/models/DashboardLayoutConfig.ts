import mongoose, { Document, Schema } from 'mongoose';

export interface IDashboardLayoutConfig extends Document {
    layout_id: string;
    tenant_id: string;
    config: {
        widgets: Array<{
            id: string;
            type: string;
            title: string;
            position: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            settings?: {
                metric_id?: string;
                chart_type?: string;
                date_range?: string;
                filters?: Record<string, unknown>;
            };
        }>;
        theme?: string;
        refresh_interval?: number;
    };
    created_at: Date;
    updated_at: Date;
}

const DashboardLayoutConfigSchema = new Schema<IDashboardLayoutConfig>(
    {
        layout_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        config: {
            widgets: [{
                id: { type: String, required: true },
                type: { type: String, required: true },
                title: String,
                position: {
                    x: { type: Number, required: true },
                    y: { type: Number, required: true },
                    width: { type: Number, required: true },
                    height: { type: Number, required: true },
                },
                settings: {
                    metric_id: String,
                    chart_type: String,
                    date_range: String,
                    filters: Schema.Types.Mixed,
                },
            }],
            theme: String,
            refresh_interval: Number,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const DashboardLayoutConfig = mongoose.model<IDashboardLayoutConfig>('DashboardLayoutConfig', DashboardLayoutConfigSchema);
