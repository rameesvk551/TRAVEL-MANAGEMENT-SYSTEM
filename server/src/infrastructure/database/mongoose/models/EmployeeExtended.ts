import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeExtended extends Document {
    employee_id: string;
    tenant_id: string;
    contact: {
        personal_email?: string;
        personal_phone?: string;
        address?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            country?: string;
            postal_code?: string;
        };
    };
    emergency_contacts: Array<{
        name: string;
        relationship: string;
        phone: string;
        email?: string;
    }>;
    attributes: {
        date_of_birth?: Date;
        gender?: string;
        nationality?: string;
        marital_status?: string;
        blood_group?: string;
        languages?: string[];
        certifications?: Array<{
            name: string;
            issuer: string;
            issue_date?: Date;
            expiry_date?: Date;
            certificate_url?: string;
        }>;
        bank_details?: {
            bank_name?: string;
            account_number?: string;
            ifsc_code?: string;
            account_holder_name?: string;
        };
        custom_fields?: Record<string, unknown>;
    };
    created_at: Date;
    updated_at: Date;
}

const EmployeeExtendedSchema = new Schema<IEmployeeExtended>(
    {
        employee_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        contact: {
            personal_email: String,
            personal_phone: String,
            address: {
                line1: String,
                line2: String,
                city: String,
                state: String,
                country: String,
                postal_code: String,
            },
        },
        emergency_contacts: [{
            name: { type: String, required: true },
            relationship: { type: String, required: true },
            phone: { type: String, required: true },
            email: String,
        }],
        attributes: {
            date_of_birth: Date,
            gender: String,
            nationality: String,
            marital_status: String,
            blood_group: String,
            languages: [String],
            certifications: [{
                name: String,
                issuer: String,
                issue_date: Date,
                expiry_date: Date,
                certificate_url: String,
            }],
            bank_details: {
                bank_name: String,
                account_number: String,
                ifsc_code: String,
                account_holder_name: String,
            },
            custom_fields: Schema.Types.Mixed,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const EmployeeExtended = mongoose.model<IEmployeeExtended>('EmployeeExtended', EmployeeExtendedSchema);
