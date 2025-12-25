import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface WhatsappConversationAttributes {
    id: string;
    tenant_id: string;
    whatsapp_thread_id?: string;
    primary_actor_phone?: string;
    primary_actor_name?: string;
    state?: string;
    last_activity_at?: Date;
}

export interface WhatsappConversationCreationAttributes extends Optional<WhatsappConversationAttributes, 'id'> {}

export class WhatsappConversation extends Model<WhatsappConversationAttributes, WhatsappConversationCreationAttributes> implements WhatsappConversationAttributes {
    public id!: string;
    public tenant_id!: string;
    public whatsapp_thread_id?: string;
    public primary_actor_phone?: string;
    public primary_actor_name?: string;
    public state?: string;
    public last_activity_at?: Date;
}

WhatsappConversation.init(
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
        whatsapp_thread_id: DataTypes.STRING,
        primary_actor_phone: DataTypes.STRING,
        primary_actor_name: DataTypes.STRING,
        state: DataTypes.STRING,
        last_activity_at: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'whatsapp_conversations',
        underscored: true,
        timestamps: false,
    }
);
