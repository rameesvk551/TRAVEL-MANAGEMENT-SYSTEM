import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappBusinessConfig extends Model {
        static associate(models: any) {
            WhatsappBusinessConfig.belongsTo(models.Tenant, {
                foreignKey: 'tenant_id',
                as: 'tenant',
            });
        }
    }

    WhatsappBusinessConfig.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true,
            },
            credential_source: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'own',
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending',
            },
            onboarding_method: {
                type: DataTypes.STRING,
                defaultValue: 'manual',
            },
            access_token: DataTypes.TEXT,
            phone_number_id: DataTypes.STRING,
            waba_id: DataTypes.STRING,
            business_id: DataTypes.STRING,
            phone_display: DataTypes.STRING,
            verified_name: DataTypes.STRING,
            quality_rating: DataTypes.STRING,
            business_name: DataTypes.STRING,
            webhook_verify_token: DataTypes.STRING,
            features: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            rate_limits: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            connected_at: DataTypes.DATE,
            last_sync_at: DataTypes.DATE,
            error_message: DataTypes.TEXT,
        },
        {
            sequelize,
            tableName: 'whatsapp_business_configs',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return WhatsappBusinessConfig;
};
