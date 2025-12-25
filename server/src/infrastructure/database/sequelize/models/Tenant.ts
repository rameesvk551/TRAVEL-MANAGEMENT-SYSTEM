import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface TenantAttributes {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface TenantCreationAttributes extends Optional<TenantAttributes, 'id' | 'is_active'> {}

export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
    public id!: string;
    public name!: string;
    public slug!: string;
    public is_active!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
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
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'tenants',
        underscored: true,
        timestamps: true,
    }
);
