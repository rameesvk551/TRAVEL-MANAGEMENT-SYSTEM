import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface GearRentalAttributes {
    id: string;
    tenant_id: string;
    rental_number?: string;
    status?: string;
    customer_name?: string;
    start_date?: Date;
    end_date?: Date;
    total_amount?: number;
}

export interface GearRentalCreationAttributes extends Optional<GearRentalAttributes, 'id'> {}

export class GearRental extends Model<GearRentalAttributes, GearRentalCreationAttributes> implements GearRentalAttributes {
    public id!: string;
    public tenant_id!: string;
    public rental_number?: string;
    public status?: string;
    public customer_name?: string;
    public start_date?: Date;
    public end_date?: Date;
    public total_amount?: number;
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
