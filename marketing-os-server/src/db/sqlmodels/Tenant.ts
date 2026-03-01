import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Tenant extends Model {
        static associate(models: any) {
            Tenant.hasMany(models.User, { foreignKey: 'tenant_id', as: 'users' });
        }
    }

    Tenant.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            location: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            settings: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: {}
            }
        },
        {
            sequelize,
            tableName: 'tenants',
            underscored: true,
            timestamps: true,
        }
    );

    return Tenant;
};
