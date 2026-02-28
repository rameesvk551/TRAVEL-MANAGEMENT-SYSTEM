import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappOptIn extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    WhatsappOptIn.init(
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
        phone_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        opt_in_date: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'whatsapp_opt_ins',
        underscored: true,
        timestamps: false,
    }
);

    return WhatsappOptIn;
};
