import fs from 'fs';
import path from 'path';

const searchDir = path.resolve('src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(searchDir, (filePath) => {
    if (filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        // Match import/export ... from './...' or '../...' missing .js
        const regex = /(import|export)\s+(?:type\s+)?(?:[^'"]+)\s+from\s+['"](\.[^'"]+)['"]/g;
        content = content.replace(regex, (match, type, importPath) => {
            if (!importPath.endsWith('.js') && !importPath.endsWith('.ts')) {
                modified = true;
                return match.replace(importPath, importPath + '.js');
            }
            return match;
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed imports in ${filePath}`);
        }
    }
});
