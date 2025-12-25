import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityMetadata extends Document {
    activity_id: string;
    tenant_id: string;
    metadata: {
        call_duration?: number;
        call_recording_url?: string;
        email_template_id?: string;
        email_opens?: number;
        email_clicks?: number;
        meeting_link?: string;
        meeting_attendees?: string[];
        location?: string;
        attachments?: Array<{
            name: string;
            url: string;
            type: string;
        }>;
        custom_data?: Record<string, unknown>;
    };
    created_at: Date;
    updated_at: Date;
}

const ActivityMetadataSchema = new Schema<IActivityMetadata>(
    {
        activity_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        metadata: {
            call_duration: Number,
            call_recording_url: String,
            email_template_id: String,
            email_opens: Number,
            email_clicks: Number,
            meeting_link: String,
            meeting_attendees: [String],
            location: String,
            attachments: [{
                name: String,
                url: String,
                type: String,
            }],
            custom_data: Schema.Types.Mixed,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const ActivityMetadata = mongoose.model<IActivityMetadata>('ActivityMetadata', ActivityMetadataSchema);
