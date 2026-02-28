import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class DashboardLayout extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    DashboardLayout.init(
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
        user_id: DataTypes.UUID,
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'dashboard_layouts',
        underscored: true,
        timestamps: false,
    }
);

    return DashboardLayout;
};
