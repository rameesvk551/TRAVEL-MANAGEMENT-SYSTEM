import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappTemplate extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    WhatsappTemplate.init(
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
        template_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: DataTypes.STRING,
        use_case: DataTypes.STRING,
        body_content: DataTypes.TEXT,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'draft',
        },
    },
    {
        sequelize,
        tableName: 'whatsapp_templates',
        underscored: true,
        timestamps: false,
    }
);

    return WhatsappTemplate;
};
