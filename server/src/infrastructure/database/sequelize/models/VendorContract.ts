import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface VendorContractAttributes {
    id: string;
    tenant_id: string;
    vendor_id: string;
    contract_number?: string;
    version?: number;
    start_date?: Date;
    end_date?: Date;
    status: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface VendorContractCreationAttributes extends Optional<VendorContractAttributes, 'id' | 'status'> {}

export class VendorContract extends Model<VendorContractAttributes, VendorContractCreationAttributes> implements VendorContractAttributes {
    public id!: string;
    public tenant_id!: string;
    public vendor_id!: string;
    public contract_number?: string;
    public version?: number;
    public start_date?: Date;
    public end_date?: Date;
    public status!: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

VendorContract.init(
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
        contract_number: DataTypes.STRING,
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        start_date: DataTypes.DATEONLY,
        end_date: DataTypes.DATEONLY,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'draft',
        },
    },
    {
        sequelize,
        tableName: 'vendor_contracts',
        underscored: true,
        timestamps: true,
    }
);
