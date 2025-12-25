import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentGatewayResponse extends Document {
    payment_id: string;
    tenant_id: string;
    gateway_response: {
        raw_response?: Record<string, unknown>;
        error_code?: string;
        error_message?: string;
        transaction_id?: string;
        authorization_code?: string;
        card_last_four?: string;
        card_brand?: string;
        bank_name?: string;
        upi_id?: string;
        wallet_name?: string;
    };
    created_at: Date;
    updated_at: Date;
}

const PaymentGatewayResponseSchema = new Schema<IPaymentGatewayResponse>(
    {
        payment_id: { type: String, required: true, unique: true, index: true },
        tenant_id: { type: String, required: true, index: true },
        gateway_response: {
            raw_response: Schema.Types.Mixed,
            error_code: String,
            error_message: String,
            transaction_id: String,
            authorization_code: String,
            card_last_four: String,
            card_brand: String,
            bank_name: String,
            upi_id: String,
            wallet_name: String,
        },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const PaymentGatewayResponse = mongoose.model<IPaymentGatewayResponse>('PaymentGatewayResponse', PaymentGatewayResponseSchema);
