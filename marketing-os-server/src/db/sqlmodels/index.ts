import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import configSettings from '../../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = configSettings[env as keyof typeof configSettings];

const db: any = {};

let sequelize: Sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable] as string, config as any);
} else {
    sequelize = new Sequelize((config as any).database, (config as any).username, (config as any).password, config as any);
}

// Read all TS model files using synchronous import via a custom require approach or explicit dynamic import mapping.
// Since top level await is supported in ESModules, we can dynamically load them asynchronously.
const loadModels = async () => {
    const files = fs.readdirSync(__dirname).filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.ts') && (!file.endsWith('.d.ts'));
    });

    for (const file of files) {
        const importPath = `file://${path.join(__dirname, file)}`;
        const module = await import(importPath);
        const modelDef = module.default;
        const model = modelDef(sequelize, DataTypes);
        db[model.name] = model;
    }

    // Associate Models
    Object.keys(db).forEach(modelName => {
        if (db[modelName].associate) {
            db[modelName].associate(db);
        }
    });

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
};

// Start the loader immediately. (Note: other modules that import `db` immediately might have to wait for top-level await if using this in ES Modules).
await loadModels();

export default db;
