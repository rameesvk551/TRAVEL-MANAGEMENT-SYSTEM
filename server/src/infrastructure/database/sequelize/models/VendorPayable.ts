import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface VendorPayableAttributes {
    id: string;
    tenant_id: string;
    vendor_id: string;
    assignment_id?: string;
    payable_number?: string;
    net_payable?: number;
    due_date?: Date;
    status: string;
    amount_settled?: number;
}

export interface VendorPayableCreationAttributes extends Optional<VendorPayableAttributes, 'id' | 'status'> {}

export class VendorPayable extends Model<VendorPayableAttributes, VendorPayableCreationAttributes> implements VendorPayableAttributes {
    public id!: string;
    public tenant_id!: string;
    public vendor_id!: string;
    public assignment_id?: string;
    public payable_number?: string;
    public net_payable?: number;
    public due_date?: Date;
    public status!: string;
    public amount_settled?: number;
}

VendorPayable.init(
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
        assignment_id: DataTypes.UUID,
        payable_number: DataTypes.STRING,
        net_payable: DataTypes.DECIMAL,
        due_date: DataTypes.DATEONLY,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        amount_settled: DataTypes.DECIMAL,
    },
    {
        sequelize,
        tableName: 'vendor_payables',
        underscored: true,
        timestamps: false,
    }
);
