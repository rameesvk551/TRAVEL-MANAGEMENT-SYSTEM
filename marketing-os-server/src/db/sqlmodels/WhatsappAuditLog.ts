import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappAuditLog extends Model {
        static associate(models: any) {
            WhatsappAuditLog.belongsTo(models.Tenant, {
                foreignKey: 'tenant_id',
                as: 'tenant',
            });
        }
    }

    WhatsappAuditLog.init(
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
            event_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            actor_type: {
                type: DataTypes.STRING,
                defaultValue: 'SYSTEM',
            },
            actor_id: DataTypes.STRING,
            actor_phone: DataTypes.STRING,
            entity_type: DataTypes.STRING,
            entity_id: DataTypes.STRING,
            payload: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            ip_address: DataTypes.STRING,
            user_agent: DataTypes.TEXT,
        },
        {
            sequelize,
            tableName: 'whatsapp_audit_logs',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: false,
        }
    );

    return WhatsappAuditLog;
};
