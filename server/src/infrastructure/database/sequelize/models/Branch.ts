import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface BranchAttributes {
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    type: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    parent_branch_id?: string;
    manager_id?: string;
    currency?: string;
    description?: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface BranchCreationAttributes extends Optional<BranchAttributes, 'id' | 'is_active'> {}

export class Branch extends Model<BranchAttributes, BranchCreationAttributes> implements BranchAttributes {
    public id!: string;
    public tenant_id!: string;
    public name!: string;
    public code!: string;
    public type!: string;
    public address_line1?: string;
    public address_line2?: string;
    public city?: string;
    public state?: string;
    public country?: string;
    public postal_code?: string;
    public phone?: string;
    public email?: string;
    public latitude?: number;
    public longitude?: number;
    public timezone?: string;
    public parent_branch_id?: string;
    public manager_id?: string;
    public currency?: string;
    public description?: string;
    public is_active!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Branch.init(
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
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address_line1: DataTypes.STRING,
        address_line2: DataTypes.STRING,
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        country: DataTypes.STRING,
        postal_code: DataTypes.STRING,
        phone: DataTypes.STRING,
        email: DataTypes.STRING,
        latitude: DataTypes.DECIMAL,
        longitude: DataTypes.DECIMAL,
        timezone: DataTypes.STRING,
        parent_branch_id: DataTypes.UUID,
        manager_id: DataTypes.UUID,
        currency: DataTypes.STRING,
        description: DataTypes.TEXT,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'branches',
        underscored: true,
        timestamps: true,
    }
);
