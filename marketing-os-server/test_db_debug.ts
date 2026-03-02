import 'dotenv/config'; // Load env
import { sequelize } from './src/config/database.js';

async function run() {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        await sequelize.query("DELETE FROM \"SequelizeMeta\" WHERE name LIKE '%store%';");
        console.log('Migration records deleted.');
    } catch (e: any) {
        console.error('Error Details:');
        console.error(e.message);
        console.error(e.stack);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
