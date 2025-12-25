import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface WhatsappMessageAttributes {
    id: string;
    tenant_id: string;
    conversation_id: string;
    direction?: string;
    message_type?: string;
    status?: string;
    linked_lead_id?: string;
    linked_booking_id?: string;
}

export interface WhatsappMessageCreationAttributes extends Optional<WhatsappMessageAttributes, 'id'> {}

export class WhatsappMessage extends Model<WhatsappMessageAttributes, WhatsappMessageCreationAttributes> implements WhatsappMessageAttributes {
    public id!: string;
    public tenant_id!: string;
    public conversation_id!: string;
    public direction?: string;
    public message_type?: string;
    public status?: string;
    public linked_lead_id?: string;
    public linked_booking_id?: string;
}

WhatsappMessage.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenant_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        conversation_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        direction: DataTypes.STRING,
        message_type: DataTypes.STRING,
        status: DataTypes.STRING,
        linked_lead_id: DataTypes.UUID,
        linked_booking_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'whatsapp_messages',
        underscored: true,
        timestamps: false,
    }
);
