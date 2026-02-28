import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class LeadModel extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    LeadModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'tenant_id'
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        firstName: {
            type: DataTypes.STRING,
            field: 'first_name',
            allowNull: true
        },
        lastName: {
            type: DataTypes.STRING,
            field: 'last_name',
            allowNull: true
        },
        name: {
            type: DataTypes.VIRTUAL,
            get() {
                const firstName = this.getDataValue('firstName');
                const lastName = this.getDataValue('lastName');
                const email = this.getDataValue('email');
                if (firstName && lastName) return `${firstName} ${lastName}`;
                if (firstName) return firstName;
                return email || 'Unknown';
            }
        },
        company: {
            type: DataTypes.STRING,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        source: {
            type: DataTypes.STRING,
            defaultValue: 'manual'
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'new'
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        tags: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        customFields: {
            type: DataTypes.JSONB,
            defaultValue: {},
            field: 'custom_fields'
        },
        ownerId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'owner_id'
        },
        lastActivityAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_activity_at'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    },
    {
        sequelize,
        tableName: 'crm_leads',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

    return LeadModel;
};
