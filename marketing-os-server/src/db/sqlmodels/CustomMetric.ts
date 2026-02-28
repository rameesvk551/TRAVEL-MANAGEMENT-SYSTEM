import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class CustomMetric extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    CustomMetric.init(
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        dataset: DataTypes.STRING,
    },
    {
        sequelize,
        tableName: 'custom_metrics',
        underscored: true,
        timestamps: false,
    }
);

    return CustomMetric;
};
