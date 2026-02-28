import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class BranchPermission extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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

    return BranchPermission;
};
