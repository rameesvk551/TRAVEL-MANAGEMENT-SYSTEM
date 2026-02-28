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

        // This regex matches cases where `.js` was appended to what should have been a directory import.
        // It looks for any import/export from `something.js`.
        const regex = /(import|export)\s+(?:type\s+)?(?:[^'"]+)\s+from\s+['"](\.[^'"]+)\.js['"]/g;

        content = content.replace(regex, (match, type, importPath) => {
            // Check if the importPath (without .js) resolves to a directory locally
            const absoluteImportPath = path.resolve(path.dirname(filePath), importPath);
            try {
                if (fs.statSync(absoluteImportPath).isDirectory()) {
                    // It's a directory! It needs /index.js instead of .js
                    modified = true;
                    return match.replace(importPath + '.js', importPath + '/index.js');
                }
            } catch (e) {
                // Ignore, path doesn't exist
            }
            return match;
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed index imports in ${filePath}`);
        }
    }
});
