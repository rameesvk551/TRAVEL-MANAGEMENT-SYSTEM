import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class User extends Model {
        static associate(models: any) {
            User.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
        }
    }

    User.init(
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
            branch_id: DataTypes.UUID,
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password_hash: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            profile: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            department_id: DataTypes.UUID,
            salary: DataTypes.DECIMAL,
            joining_date: DataTypes.DATEONLY,
        },
        {
            sequelize,
            tableName: 'users',
            underscored: true,
            timestamps: true,
        }
    );

    return User;
};
