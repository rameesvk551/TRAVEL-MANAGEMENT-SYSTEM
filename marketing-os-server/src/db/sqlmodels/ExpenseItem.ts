import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class ExpenseItem extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    ExpenseItem.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        claim_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: DataTypes.STRING,
        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        currency: DataTypes.STRING,
        date: DataTypes.DATEONLY,
        payment_method: DataTypes.STRING,
        receipt_url: DataTypes.TEXT,
    },
    {
        sequelize,
        tableName: 'expense_items',
        underscored: true,
        timestamps: false,
    }
);

    return ExpenseItem;
};
