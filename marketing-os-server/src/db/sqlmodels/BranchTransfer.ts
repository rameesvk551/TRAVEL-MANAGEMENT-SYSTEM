import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class BranchTransfer extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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

    return BranchTransfer;
};
