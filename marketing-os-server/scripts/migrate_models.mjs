import fs from 'fs';
import path from 'path';

const SRC_DIR = './src/database/models';
const DEST_DIR = './src/db/sqlmodels';

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

const files = fs.readdirSync(SRC_DIR).filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'associations.ts');

let converted = 0;
let failed = 0;

for (const file of files) {
    try {
        const filePath = path.join(SRC_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Super naive parsing to extract model name and init config
        // This expects the typical Sequelize TS pattern:
        // class ModelName extends Model { ... }
        // ModelName.init({ ... }, { sequelize, tableName: '...' });

        const classMatch = content.match(/class\s+(\w+)\s+extends\s+Model/);
        if (!classMatch) {
            console.warn(`Could not find class definition in ${file}`);
            failed++;
            continue;
        }
        const modelName = classMatch[1];

        // Attempt to extract the `.init(` block
        const initMatch = content.match(new RegExp(`${modelName}\\.init\\s*\\([\\s\\S]*?\\}\\s*\\);`, 'm'));
        let initBlock = '';
        if (initMatch) {
            initBlock = initMatch[0];
        } else {
            console.warn(`Could not find init block in ${file}`);
            failed++;
            continue;
        }

        // Now construct the dynamic functional loading model format
        const newContent = `import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class ${modelName} extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    ${initBlock}

    return ${modelName};
};
`;

        fs.writeFileSync(path.join(DEST_DIR, file), newContent);
        converted++;
    } catch (error) {
        console.error(`Failed to migrate ${file}:`, error);
        failed++;
    }
}

console.log(`Migration complete. Converted: ${converted}, Failed: ${failed}`);
