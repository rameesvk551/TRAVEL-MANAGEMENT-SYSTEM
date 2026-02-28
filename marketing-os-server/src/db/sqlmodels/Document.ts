import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Document extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Document.init(
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
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        file_url: DataTypes.TEXT,
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        expiry_date: DataTypes.DATEONLY,
    },
    {
        sequelize,
        tableName: 'documents',
        underscored: true,
        timestamps: false,
    }
);

    return Document;
};
