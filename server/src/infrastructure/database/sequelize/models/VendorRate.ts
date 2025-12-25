import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface VendorRateAttributes {
    id: string;
    tenant_id: string;
    vendor_id: string;
    contract_id?: string;
    rate_name: string;
    rate_type?: string;
    valid_from?: Date;
    valid_until?: Date;
    base_rate?: number;
    currency?: string;
    is_active: boolean;
}

export interface VendorRateCreationAttributes extends Optional<VendorRateAttributes, 'id' | 'is_active'> {}

export class VendorRate extends Model<VendorRateAttributes, VendorRateCreationAttributes> implements VendorRateAttributes {
    public id!: string;
    public tenant_id!: string;
    public vendor_id!: string;
    public contract_id?: string;
    public rate_name!: string;
    public rate_type?: string;
    public valid_from?: Date;
    public valid_until?: Date;
    public base_rate?: number;
    public currency?: string;
    public is_active!: boolean;
}

VendorRate.init(
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
        vendor_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        contract_id: DataTypes.UUID,
        rate_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rate_type: DataTypes.STRING,
        valid_from: DataTypes.DATEONLY,
        valid_until: DataTypes.DATEONLY,
        base_rate: DataTypes.DECIMAL,
        currency: DataTypes.STRING,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'vendor_rates',
        underscored: true,
        timestamps: false,
    }
);
