import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface VendorAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    legal_name: string;
    display_name?: string;
    vendor_type?: string;
    vendor_code?: string;
    status: string;
    primary_contact_name?: string;
    primary_contact_phone?: string;
    primary_contact_email?: string;
    bank_name?: string;
    bank_account_number?: string;
    tax_id?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface VendorCreationAttributes extends Optional<VendorAttributes, 'id' | 'status'> {}

export class Vendor extends Model<VendorAttributes, VendorCreationAttributes> implements VendorAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public legal_name!: string;
    public display_name?: string;
    public vendor_type?: string;
    public vendor_code?: string;
    public status!: string;
    public primary_contact_name?: string;
    public primary_contact_phone?: string;
    public primary_contact_email?: string;
    public bank_name?: string;
    public bank_account_number?: string;
    public tax_id?: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Vendor.init(
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
        branch_id: DataTypes.UUID,
        legal_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        display_name: DataTypes.STRING,
        vendor_type: DataTypes.STRING,
        vendor_code: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'active',
        },
        primary_contact_name: DataTypes.STRING,
        primary_contact_phone: DataTypes.STRING,
        primary_contact_email: DataTypes.STRING,
        bank_name: DataTypes.STRING,
        bank_account_number: DataTypes.STRING,
        tax_id: DataTypes.STRING,
    },
    {
        sequelize,
        tableName: 'vendors',
        underscored: true,
        timestamps: true,
    }
);
