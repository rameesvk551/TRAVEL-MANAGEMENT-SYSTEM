import dotenv from 'dotenv';
dotenv.config();

const POSTGRES_URL = process.env.POSTGRES_URL;

export default {
    development: {
        use_env_variable: 'POSTGRES_URL',
        dialect: 'postgres'
    },
    dev: {
        use_env_variable: 'POSTGRES_URL',
        dialect: 'postgres'
    },
    test: {
        use_env_variable: 'POSTGRES_URL',
        dialect: 'postgres'
    },
    production: {
        use_env_variable: 'POSTGRES_URL',
        dialect: 'postgres'
    }
};
