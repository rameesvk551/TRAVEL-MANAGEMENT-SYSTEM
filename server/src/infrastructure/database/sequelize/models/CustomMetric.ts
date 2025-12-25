import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface CustomMetricAttributes {
    id: string;
    tenant_id: string;
    name: string;
    dataset?: string;
}

export interface CustomMetricCreationAttributes extends Optional<CustomMetricAttributes, 'id'> {}

export class CustomMetric extends Model<CustomMetricAttributes, CustomMetricCreationAttributes> implements CustomMetricAttributes {
    public id!: string;
    public tenant_id!: string;
    public name!: string;
    public dataset?: string;
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
