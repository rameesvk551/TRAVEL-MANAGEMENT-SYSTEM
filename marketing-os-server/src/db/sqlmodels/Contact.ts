import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Contact extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Contact.init(
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
        branch_id: DataTypes.UUID,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        whatsapp: DataTypes.STRING,
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: DataTypes.STRING,
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
        },
        travel_history: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        preferences: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        social_handles: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        marketing_consent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'contacts',
        underscored: true,
        timestamps: true,
    }
);

    return Contact;
};
