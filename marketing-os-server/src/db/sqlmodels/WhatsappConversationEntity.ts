import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappConversationEntity extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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

    return WhatsappConversationEntity;
};
