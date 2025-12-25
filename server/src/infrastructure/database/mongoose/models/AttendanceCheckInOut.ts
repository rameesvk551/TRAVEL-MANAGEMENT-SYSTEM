import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceCheckInOut extends Document {
    attendance_id: string;
    tenant_id: string;
    check_in: {
        time?: Date;
        location?: {
            lat?: number;
            lng?: number;
            address?: string;
        };
        method?: string;
        device_id?: string;
        ip_address?: string;
        photo_url?: string;
    };
    check_out: {
        time?: Date;
        location?: {
            lat?: number;
            lng?: number;
            address?: string;
        };
        method?: string;
        device_id?: string;
        ip_address?: string;
        photo_url?: string;
    };
    created_at: Date;
    updated_at: Date;
}

const AttendanceCheckInOutSchema = new Schema<IAttendanceCheckInOut>(
    {
        attendance_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        check_in: {
            time: Date,
            location: {
                lat: Number,
                lng: Number,
                address: String,
            },
            method: String,
            device_id: String,
            ip_address: String,
            photo_url: String,
        },
        check_out: {
            time: Date,
            location: {
                lat: Number,
                lng: Number,
                address: String,
            },
            method: String,
            device_id: String,
            ip_address: String,
            photo_url: String,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const AttendanceCheckInOut = mongoose.model<IAttendanceCheckInOut>('AttendanceCheckInOut', AttendanceCheckInOutSchema);
