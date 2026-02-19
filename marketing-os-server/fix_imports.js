import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
    let files;
    try {
        files = fs.readdirSync(dirPath);
    } catch (e) {
        console.error(`Error reading directory ${dirPath}:`, e);
        return arrayOfFiles || [];
    }

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        try {
            if (fs.statSync(fullPath).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git') {
                    arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
                }
            } else {
                if (file.endsWith('.ts')) {
                    arrayOfFiles.push(fullPath);
                }
            }
        } catch (e) {
            console.error(`Error processing file ${fullPath}:`, e);
        }
    });

    return arrayOfFiles;
}

console.log('Starting import fix...');
const files = getAllFiles('./src');
console.log(`Found ${files.length} typescript files.`);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // 1. Application imports -> modules
    // Services
    content = content.replace(/(['"])(\.\.\/)+application\/(\w+)\/services\/\w+(?:.js)?(['"])/g, '$1$2modules/$3$4');

    // DTOs/Types
    content = content.replace(/(['"])(\.\.\/)+application\/(\w+)\/dtos\/(\w+)(['"])/g, '$1$2modules/$3$5');
    content = content.replace(/(['"])(\.\.\/)+application\/(\w+)\/types(\.js)?(['"])/g, '$1$2modules/$3/billing.types.js$5'); // Specific for billing

    // Generic application fallback
    // content = content.replace(/(['"])(\.\.\/)+application\/(\w+)\/.*(['"])/g, '$1$2modules/$3$4');

    // 2. Infrastructure imports
    // Repositories -> modules
    content = content.replace(/(['"])(\.\.\/)+infrastructure\/(\w+)\/repositories\/\w+(?:.js)?(['"])/g, '$1$2modules/$3$4');

    // Models -> modules/models (or just module index if exported? Assume index for now if possible, else direct path)
    // But I moved models to modules/<module>/models.
    // And index.ts DOES NOT export models usually (except Auth?).
    // So I should point to the file.
    // infrastructure/revenue/models/RevenueModel -> modules/revenue/models/RevenueModel
    content = content.replace(/(['"])(\.\.\/)+infrastructure\/(\w+)\/models\/(\w+)(['"])/g, '$1$2modules/$3/models/$4$5');

    // Database -> database
    content = content.replace(/(['"])(\.\.\/)+infrastructure\/database\/sequelize\/models(\/.*)?(['"])/g, '$1$2database/models$3$4');

    // 3. Presentation imports
    // Controllers -> modules (index)
    // presentation/revenue/controllers/RevenueController -> modules/revenue
    content = content.replace(/(['"])(\.\.\/)+presentation\/(\w+)\/(?:controllers\/)?\w+(?:Controller)?(?:.js)?(['"])/g, '$1$2modules/$3$4');

    // Routes files -> specific module route files
    content = content.replace(/(['"])(\.\.\/)+presentation\/routes\/omnichannel\.routes(?:.js)?(['"])/g, '$1$2modules/inbox/omnichannel.routes.js$3');
    content = content.replace(/(['"])(\.\.\/)+presentation\/routes\/instagram\.routes(?:.js)?(['"])/g, '$1$2modules/inbox/instagram.routes.js$3');
    content = content.replace(/(['"])(\.\.\/)+presentation\/routes\/automation\.routes(?:.js)?(['"])/g, '$1$2modules/automation/automation.routes.js$3');
    content = content.replace(/(['"])(\.\.\/)+presentation\/routes\/whatsapp\.routes(?:.js)?(['"])/g, '$1$2modules/whatsapp/whatsapp.routes.js$3');

    // Revenue routes
    content = content.replace(/(['"])(\.\.\/)+presentation\/revenue\/routes(?:.js)?(['"])/g, '$1$2modules/revenue/revenue.routes.js$3');

    // Product/Ads/AI/Monitoring routes were INLINE in controller.
    // They are handled by the controller replacement above (if imported as file).
    // If imported as { createProductRoutes } from '.../ProductController', it becomes '.../modules/product'.
    // And index.ts exports `createProductRoutes` from `product.controller.js`.
    // So imports like `import { createProductRoutes } from '../../presentation/product/ProductController'` 
    // become `import ... from '../../modules/product'`.
    // This is correct!

    // 4. Clean up double dots if any ... (handled by $2)

    // 5. Shared/Utils/Config (should remain or be fixed if in application?)
    // application/shared -> shared? (No, shared is in src/shared)
    // application/utils -> utils?

    // 5. Domain imports

    // Entities
    content = content.replace(/(['"])(\.\.\/)+domain\/entities\/Contact(?:.js)?(['"])/g, '$1$2modules/crm/models/Contact.js$3');
    content = content.replace(/(['"])(\.\.\/)+domain\/entities\/Tenant(?:.js)?(['"])/g, '$1$2modules/tenants/models/Tenant.js$3');
    content = content.replace(/(['"])(\.\.\/)+domain\/entities\/whatsapp\/(\w+)(?:.js)?(['"])/g, '$1$2modules/whatsapp/models/$3$4');

    // Interfaces
    content = content.replace(/(['"])(\.\.\/)+domain\/interfaces\/ILeadRepository(?:.js)?(['"])/g, '$1$2modules/crm/interfaces/ILeadRepository.js$3');
    content = content.replace(/(['"])(\.\.\/)+domain\/interfaces\/ITenantRepository(?:.js)?(['"])/g, '$1$2modules/tenants/interfaces/ITenantRepository.js$3');

    // Domain Feature Folders
    // Marketing
    content = content.replace(/(['"])(\.\.\/)+domain\/marketing\/entities\/(\w+)(?:.js)?(['"])/g, '$1$2modules/campaigns/models/$3$4');
    content = content.replace(/(['"])(\.\.\/)+domain\/marketing\/repositories\/(\w+)(?:.js)?(['"])/g, '$1$2modules/campaigns/interfaces/$3$4');

    // Growth
    content = content.replace(/(['"])(\.\.\/)+domain\/growth\/entities\/(\w+)(?:.js)?(['"])/g, '$1$2modules/growth/models/$3$4');
    content = content.replace(/(['"])(\.\.\/)+domain\/growth\/repositories\/(\w+)(?:.js)?(['"])/g, '$1$2modules/growth/interfaces/$3$4');

    // Generic Domain Fallback (careful)
    content = content.replace(/(['"])(\.\.\/)+domain\/interfaces\/crm\/(\w+)(?:.js)?(['"])/g, '$1$2modules/crm/interfaces/$3$4');
    content = content.replace(/(['"])(\.\.\/)+domain\/interfaces\/whatsapp\/(\w+)(?:.js)?(['"])/g, '$1$2modules/whatsapp/interfaces/$3$4');

    if (content !== originalContent) {
        console.log(`Updating imports in ${file}`);
        fs.writeFileSync(file, content);
    }
});
console.log('Done.');
