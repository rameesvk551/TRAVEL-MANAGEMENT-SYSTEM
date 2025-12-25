import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface DashboardLayoutAttributes {
    id: string;
    tenant_id: string;
    user_id?: string;
    name: string;
}

export interface DashboardLayoutCreationAttributes extends Optional<DashboardLayoutAttributes, 'id'> {}

export class DashboardLayout extends Model<DashboardLayoutAttributes, DashboardLayoutCreationAttributes> implements DashboardLayoutAttributes {
    public id!: string;
    public tenant_id!: string;
    public user_id?: string;
    public name!: string;
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
