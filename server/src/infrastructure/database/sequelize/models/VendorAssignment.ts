import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface VendorAssignmentAttributes {
    id: string;
    tenant_id: string;
    vendor_id: string;
    booking_id?: string;
    resource_id?: string;
    departure_id?: string;
    assignment_type?: string;
    service_start_date?: Date;
    service_end_date?: Date;
    rate_id?: string;
    net_amount?: number;
    status: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface VendorAssignmentCreationAttributes extends Optional<VendorAssignmentAttributes, 'id' | 'status'> {}

export class VendorAssignment extends Model<VendorAssignmentAttributes, VendorAssignmentCreationAttributes> implements VendorAssignmentAttributes {
    public id!: string;
    public tenant_id!: string;
    public vendor_id!: string;
    public booking_id?: string;
    public resource_id?: string;
    public departure_id?: string;
    public assignment_type?: string;
    public service_start_date?: Date;
    public service_end_date?: Date;
    public rate_id?: string;
    public net_amount?: number;
    public status!: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

VendorAssignment.init(
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
        booking_id: DataTypes.UUID,
        resource_id: DataTypes.UUID,
        departure_id: DataTypes.UUID,
        assignment_type: DataTypes.STRING,
        service_start_date: DataTypes.DATEONLY,
        service_end_date: DataTypes.DATEONLY,
        rate_id: DataTypes.UUID,
        net_amount: DataTypes.DECIMAL,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
    },
    {
        sequelize,
        tableName: 'vendor_assignments',
        underscored: true,
        timestamps: true,
    }
);
