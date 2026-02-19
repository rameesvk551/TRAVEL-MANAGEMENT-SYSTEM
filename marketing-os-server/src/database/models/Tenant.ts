import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';



export interface TenantCreationAttributes extends Optional<TenantAttributes, 'id' | 'is_active' | 'location'> { }

export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
    declare public id: string;
    declare public name: string;
    declare public slug: string;
    declare public location?: string;
    declare public is_active: boolean;
    declare public readonly created_at: Date;
    declare public readonly updated_at: Date;
    declare public settings?: any;
}

export interface TenantAttributes {
    id: string;
    name: string;
    slug: string;
    location?: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    settings?: any;
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
