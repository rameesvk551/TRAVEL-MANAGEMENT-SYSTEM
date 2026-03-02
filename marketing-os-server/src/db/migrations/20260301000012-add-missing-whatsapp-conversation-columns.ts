import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        const tableDesc = await queryInterface.describeTable('whatsapp_conversations') as Record<string, unknown>;

        // Add all missing columns that the repository expects

        if (!tableDesc['channel']) {
            await queryInterface.addColumn('whatsapp_conversations', 'channel', {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: 'WHATSAPP',
            });
        }

        if (!tableDesc['external_id']) {
            await queryInterface.addColumn('whatsapp_conversations', 'external_id', {
                type: DataTypes.STRING,
                allowNull: true,
            });
        }

        if (!tableDesc['primary_actor_type']) {
            await queryInterface.addColumn('whatsapp_conversations', 'primary_actor_type', {
                type: DataTypes.STRING,
                allowNull: true,
            });
        }

        if (!tableDesc['primary_actor_user_id']) {
            await queryInterface.addColumn('whatsapp_conversations', 'primary_actor_user_id', {
                type: DataTypes.STRING,
                allowNull: true,
            });
        }

        if (!tableDesc['primary_actor_employee_id']) {
            await queryInterface.addColumn('whatsapp_conversations', 'primary_actor_employee_id', {
                type: DataTypes.STRING,
                allowNull: true,
            });
        }

        if (!tableDesc['primary_actor_contact_id']) {
            await queryInterface.addColumn('whatsapp_conversations', 'primary_actor_contact_id', {
                type: DataTypes.STRING,
                allowNull: true,
            });
        }

        if (!tableDesc['workflow_progress']) {
            await queryInterface.addColumn('whatsapp_conversations', 'workflow_progress', {
                type: DataTypes.JSONB,
                allowNull: true,
            });
        }

        if (!tableDesc['session_started_at']) {
            await queryInterface.addColumn('whatsapp_conversations', 'session_started_at', {
                type: DataTypes.DATE,
                allowNull: true,
            });
        }

        if (!tableDesc['session_expires_at']) {
            await queryInterface.addColumn('whatsapp_conversations', 'session_expires_at', {
                type: DataTypes.DATE,
                allowNull: true,
            });
        }

        if (!tableDesc['message_count']) {
            await queryInterface.addColumn('whatsapp_conversations', 'message_count', {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
            });
        }

        if (!tableDesc['is_opted_in']) {
            await queryInterface.addColumn('whatsapp_conversations', 'is_opted_in', {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: true,
            });
        }

        if (!tableDesc['is_escalated']) {
            await queryInterface.addColumn('whatsapp_conversations', 'is_escalated', {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            });
        }

        if (!tableDesc['requires_human_review']) {
            await queryInterface.addColumn('whatsapp_conversations', 'requires_human_review', {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            });
        }

        if (!tableDesc['provider_metadata']) {
            await queryInterface.addColumn('whatsapp_conversations', 'provider_metadata', {
                type: DataTypes.JSONB,
                allowNull: true,
            });
        }

        if (!tableDesc['created_at']) {
            await queryInterface.addColumn('whatsapp_conversations', 'created_at', {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW,
            });
        }

        if (!tableDesc['updated_at']) {
            await queryInterface.addColumn('whatsapp_conversations', 'updated_at', {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW,
            });
        }
    },

    async down(queryInterface: QueryInterface) {
        const columns = [
            'channel', 'external_id', 'primary_actor_type',
            'primary_actor_user_id', 'primary_actor_employee_id', 'primary_actor_contact_id',
            'workflow_progress', 'session_started_at', 'session_expires_at',
            'message_count', 'is_opted_in', 'is_escalated',
            'requires_human_review', 'provider_metadata', 'created_at', 'updated_at',
        ];
        for (const col of columns) {
            await queryInterface.removeColumn('whatsapp_conversations', col);
        }
    },
};
