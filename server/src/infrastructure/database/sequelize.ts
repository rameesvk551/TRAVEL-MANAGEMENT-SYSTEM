import { Sequelize } from 'sequelize';
import { config } from '../../config/index.js';

export const sequelize = new Sequelize(config.database.url, {
    dialect: 'postgres',
    logging: false,
    pool: {
        min: config.database.poolMin,
        max: config.database.poolMax,
    },
    define: {
        underscored: true,
        timestamps: true,
    },
});

export async function connectSequelize() {
    try {
        await sequelize.authenticate();
        console.log('Sequelize connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database with Sequelize:', error);
        throw error;
    }
}
