import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class ExpenseClaim extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    ExpenseClaim.init(
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
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        claim_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
        trip_id: DataTypes.UUID,
        total_amount: DataTypes.DECIMAL,
        currency: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'draft',
        },
        submitted_at: DataTypes.DATE,
        reviewed_by: DataTypes.UUID,
        reviewed_at: DataTypes.DATE,
        approved_by: DataTypes.UUID,
        approved_at: DataTypes.DATE,
        paid_at: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'expense_claims',
        underscored: true,
        timestamps: true,
    }
);

    return ExpenseClaim;
};
