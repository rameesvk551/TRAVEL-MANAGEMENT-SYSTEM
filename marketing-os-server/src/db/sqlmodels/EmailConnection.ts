import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class EmailConnection extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    EmailConnection.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        workspaceId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'workspace_id',
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'smtp',
        },
        fromEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'from_email',
        },
        fromName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'from_name',
        },
        smtpHost: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'smtp_host',
        },
        smtpPort: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'smtp_port',
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        encryptedPassword: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'encrypted_password',
        },
        dailyLimit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1000,
            field: 'daily_limit',
        },
        rateLimitPerMinute: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 60,
            field: 'rate_limit_per_minute',
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'connected',
        },
    },
    {
        sequelize,
        tableName: 'email_connections',
        timestamps: true,
        underscored: true,
    }
);

    return EmailConnection;
};
