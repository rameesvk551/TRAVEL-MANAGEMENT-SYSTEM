import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface BranchTransferAttributes {
    id: string;
    tenant_id: string;
    transfer_type: string;
    reference_id: string;
    reference_code?: string;
    from_branch_id: string;
    to_branch_id: string;
    status: string;
    reason?: string;
    notes?: string;
    requested_by?: string;
    approved_by?: string;
    completed_by?: string;
    requested_at: Date;
    approved_at?: Date;
    completed_at?: Date;
    effective_date?: Date;
    metadata?: Record<string, unknown>;
    created_at?: Date;
    updated_at?: Date;
}

export interface BranchTransferCreationAttributes extends Optional<BranchTransferAttributes, 'id' | 'requested_at'> {}

export class BranchTransfer extends Model<BranchTransferAttributes, BranchTransferCreationAttributes> implements BranchTransferAttributes {
    public id!: string;
    public tenant_id!: string;
    public transfer_type!: string;
    public reference_id!: string;
    public reference_code?: string;
    public from_branch_id!: string;
    public to_branch_id!: string;
    public status!: string;
    public reason?: string;
    public notes?: string;
    public requested_by?: string;
    public approved_by?: string;
    public completed_by?: string;
    public requested_at!: Date;
    public approved_at?: Date;
    public completed_at?: Date;
    public effective_date?: Date;
    public metadata?: Record<string, unknown>;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

BranchTransfer.init(
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
        transfer_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reference_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        reference_code: DataTypes.STRING,
        from_branch_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        to_branch_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reason: DataTypes.TEXT,
        notes: DataTypes.TEXT,
        requested_by: DataTypes.UUID,
        approved_by: DataTypes.UUID,
        completed_by: DataTypes.UUID,
        requested_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        approved_at: DataTypes.DATE,
        completed_at: DataTypes.DATE,
        effective_date: DataTypes.DATE,
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'branch_transfers',
        underscored: true,
        timestamps: true,
    }
);
