import mongoose from 'mongoose';
import { config } from '../../config/index.js';

export async function connectMongoose() {
    try {
        await mongoose.connect(config.database.mongodbUrl);
        console.log('Mongoose connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to MongoDB with Mongoose:', error);
        throw error;
    }
}

export const mongooseConnection = mongoose.connection;
