import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface EmailConnectionAttributes {
    id: string;
    workspaceId: string;
    provider: 'smtp' | 'ses' | 'gmail';
    fromEmail: string;
    fromName: string;
    smtpHost: string;
    smtpPort: number;
    username?: string;
    encryptedPassword?: string;
    dailyLimit: number;
    rateLimitPerMinute: number;
    status: 'connected' | 'failed';
    createdAt?: Date;
    updatedAt?: Date;
}

interface EmailConnectionCreationAttributes extends Optional<EmailConnectionAttributes, 'id' | 'dailyLimit' | 'rateLimitPerMinute' | 'status'> { }

class EmailConnection extends Model<EmailConnectionAttributes, EmailConnectionCreationAttributes> implements EmailConnectionAttributes {
    public id!: string;
    public workspaceId!: string;
    public provider!: 'smtp' | 'ses' | 'gmail';
    public fromEmail!: string;
    public fromName!: string;
    public smtpHost!: string;
    public smtpPort!: number;
    public username!: string;
    public encryptedPassword!: string;
    public dailyLimit!: number;
    public rateLimitPerMinute!: number;
    public status!: 'connected' | 'failed';

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
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

export { EmailConnection };
