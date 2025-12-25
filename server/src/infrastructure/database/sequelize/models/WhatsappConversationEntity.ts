import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface WhatsappConversationEntityAttributes {
    id: string;
    conversation_id: string;
    entity_type: string;
    entity_id: string;
    is_primary: boolean;
}

export interface WhatsappConversationEntityCreationAttributes extends Optional<WhatsappConversationEntityAttributes, 'id' | 'is_primary'> {}

export class WhatsappConversationEntity extends Model<WhatsappConversationEntityAttributes, WhatsappConversationEntityCreationAttributes> implements WhatsappConversationEntityAttributes {
    public id!: string;
    public conversation_id!: string;
    public entity_type!: string;
    public entity_id!: string;
    public is_primary!: boolean;
}

WhatsappConversationEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        conversation_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        entity_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        entity_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        is_primary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'whatsapp_conversation_entities',
        underscored: true,
        timestamps: false,
    }
);
