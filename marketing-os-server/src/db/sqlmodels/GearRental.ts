import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class GearRental extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    GearRental.init(
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
        rental_number: DataTypes.STRING,
        status: DataTypes.STRING,
        customer_name: DataTypes.STRING,
        start_date: DataTypes.DATEONLY,
        end_date: DataTypes.DATEONLY,
        total_amount: DataTypes.DECIMAL,
    },
    {
        sequelize,
        tableName: 'gear_rentals',
        underscored: true,
        timestamps: false,
    }
);

    return GearRental;
};
