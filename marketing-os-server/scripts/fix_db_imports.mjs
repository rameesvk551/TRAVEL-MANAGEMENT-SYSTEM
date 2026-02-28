import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;

        // Replace database/models with db/sqlmodels
        content = content.replace(/database\/models/g, 'db/sqlmodels');

        // Replace database/migrations with db/migrations
        content = content.replace(/database\/migrations/g, 'db/migrations');

        // Find "import { User, Tenant } from '.../db/sqlmodels/...'"
        // and replace with "import db from '.../db/sqlmodels/...';"
        // then replace usages "User." with "db.User."
        const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]*db\/sqlmodels[^'"]*)['"];?/g;

        let match;
        const importsToFix = [];
        while ((match = importRegex.exec(content)) !== null) {
            importsToFix.push({
                fullMatch: match[0],
                namedImports: match[1].split(',').map(s => s.trim()).filter(s => s),
                path: match[2]
            });
        }

        if (importsToFix.length > 0) {
            for (const imp of importsToFix) {
                content = content.replace(imp.fullMatch, `import db from '${imp.path}';`);
                for (const named of imp.namedImports) {
                    // Regex to find "named." or "named(" but not if already prefixed by "db." or part of another word
                    const usageRegex = new RegExp(`(?<![a-zA-Z0-9_\.])${named}(?![a-zA-Z0-9_])`, 'g');
                    // Let's only replace when it's heavily used. Actually this can be dangerous (e.g., variable shadowing).
                    // A safer bet is just replacing the exact class name usages.
                    content = content.replace(usageRegex, `db.${named}`);
                }
            }
        }

        // Also look for `import * as models from ...`
        const starRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]*db\/sqlmodels[^'"]*)['"];?/g;
        while ((match = starRegex.exec(content)) !== null) {
            content = content.replace(match[0], `import db from '${match[2]}';`);
            const usageRegex = new RegExp(`(?<![a-zA-Z0-9_])${match[1]}\\.`, 'g');
            content = content.replace(usageRegex, `db.`);
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`Updated imports in ${filePath}`);
        }
    }
});
