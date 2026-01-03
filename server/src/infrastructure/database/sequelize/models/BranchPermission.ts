import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface BranchPermissionAttributes {
    id: string;
    tenant_id: string;
    user_id: string;
    branch_id: string;
    permission_level: string;
    can_view_leads: boolean;
    can_edit_leads: boolean;
    can_view_bookings: boolean;
    can_edit_bookings: boolean;
    can_view_inventory: boolean;
    can_edit_inventory: boolean;
    can_view_staff: boolean;
    can_edit_staff: boolean;
    can_view_reports: boolean;
    can_view_financials: boolean;
    granted_by?: string;
    granted_at: Date;
    expires_at?: Date;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface BranchPermissionCreationAttributes extends Optional<BranchPermissionAttributes, 'id' | 'is_active' | 'granted_at'> {}

export class BranchPermission extends Model<BranchPermissionAttributes, BranchPermissionCreationAttributes> implements BranchPermissionAttributes {
    public id!: string;
    public tenant_id!: string;
    public user_id!: string;
    public branch_id!: string;
    public permission_level!: string;
    public can_view_leads!: boolean;
    public can_edit_leads!: boolean;
    public can_view_bookings!: boolean;
    public can_edit_bookings!: boolean;
    public can_view_inventory!: boolean;
    public can_edit_inventory!: boolean;
    public can_view_staff!: boolean;
    public can_edit_staff!: boolean;
    public can_view_reports!: boolean;
    public can_view_financials!: boolean;
    public granted_by?: string;
    public granted_at!: Date;
    public expires_at?: Date;
    public is_active!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

BranchPermission.init(
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
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        branch_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        permission_level: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        can_view_leads: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        can_edit_leads: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_view_bookings: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        can_edit_bookings: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_view_inventory: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        can_edit_inventory: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_view_staff: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_edit_staff: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_view_reports: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_view_financials: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        granted_by: DataTypes.UUID,
        granted_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        expires_at: DataTypes.DATE,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'branch_permissions',
        underscored: true,
        timestamps: true,
    }
);
